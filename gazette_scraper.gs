// ============================================================
// Gazette.gov.mv Scraper — Google Apps Script
// ============================================================
//
// SETUP (one-time):
//   1. Open a Google Sheet (or create one)
//   2. Extensions > Apps Script → paste this entire file
//   3. Click "Save", then run  setupTrigger()  once
//   4. Approve the permission prompts
//   5. Done — the scraper runs automatically every 15 minutes
//
// HOW IT WORKS:
//   Each triggered run (≤ 6-minute GAS limit):
//     • Polls latest 3 pages of /gazette + /iulaan
//       → NEW entries inserted at ROW 2 (top of sheet, below header)
//     • Crawls 2 old archive pages per section from the oldest end
//       → ARCHIVE entries appended at the bottom of the sheet
//     • Duplicate detection reads existing IDs from the sheet itself
//     • Archive progress saved in PropertiesService (survives restarts)
//
// UTILITY FUNCTIONS (run manually from Apps Script editor):
//   setupTrigger()  — install the 15-min time trigger
//   removeTrigger() — stop the automatic scraping
//   resetState()    — wipe archive progress (keeps sheet data)
//   clearSheet()    — wipe all sheet data and state (full reset)
// ============================================================

// ── Configuration ─────────────────────────────────────────────
var CFG = {
  GAZETTE_URL   : "https://www.gazette.gov.mv/gazette",
  IULAAN_URL    : "https://www.gazette.gov.mv/iulaan",
  SHEET_NAME    : "Gazette Data",
  NEW_PAGES     : 3,   // latest pages to poll each run for new items
  ARCHIVE_BATCH : 2,   // old archive pages per section per run (keep within 6-min limit)
  RETRY_DELAYS  : [2000, 4000, 8000], // ms between retries
};

var HEADERS = [
  "id", "section", "type", "title", "office",
  "volume", "issue", "published_date", "deadline",
  "url", "pdf_url", "scraped_at"
];

// Column index map (1-based)
var COL = {};
HEADERS.forEach(function(h, i) { COL[h] = i + 1; });


// ── Sheet helpers ──────────────────────────────────────────────

function getOrCreateSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CFG.SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    var hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setFontWeight("bold");
    hdr.setBackground("#1a73e8");
    hdr.setFontColor("#ffffff");
    sheet.setColumnWidth(COL.title, 420);
    sheet.setColumnWidth(COL.url,   320);
    sheet.setColumnWidth(COL.pdf_url, 320);
  }
  return sheet;
}

/**
 * Read every (section, id) pair already in the sheet.
 * Returns a plain object used as a Set: { "gazette:7444": true, … }
 */
function loadExistingIds(sheet) {
  var lastRow = sheet.getLastRow();
  var ids = {};
  if (lastRow < 2) return ids;
  // Read only columns A (id) and B (section) — fast
  var data = sheet.getRange(2, COL.id, lastRow - 1, 2).getValues();
  for (var i = 0; i < data.length; i++) {
    var id      = String(data[i][0]).trim();
    var section = String(data[i][1]).trim();
    if (id && section) ids[section + ":" + id] = true;
  }
  return ids;
}

/** Prepend rows just below the header (newest at top). */
function prependRows(sheet, rows2d) {
  if (!rows2d.length) return;
  sheet.insertRowsAfter(1, rows2d.length);
  sheet.getRange(2, 1, rows2d.length, HEADERS.length).setValues(rows2d);
}

/** Append rows at the bottom (oldest archive). */
function appendRows(sheet, rows2d) {
  if (!rows2d.length) return;
  var last = Math.max(sheet.getLastRow(), 1);
  sheet.getRange(last + 1, 1, rows2d.length, HEADERS.length).setValues(rows2d);
}


// ── HTTP fetch with retry ──────────────────────────────────────

function fetchPage(baseUrl, page) {
  var url = (page > 1) ? baseUrl + "?page=" + page : baseUrl;
  var opts = {
    muteHttpExceptions: true,
    headers: { "User-Agent": "GazetteArchiveScraper/1.0 (+https://gazette.gov.mv)" }
  };

  for (var attempt = 0; attempt <= CFG.RETRY_DELAYS.length; attempt++) {
    try {
      var resp = UrlFetchApp.fetch(url, opts);
      if (resp.getResponseCode() === 200) {
        return resp.getContentText("UTF-8");
      }
      Logger.log("HTTP " + resp.getResponseCode() + " — " + url + " (attempt " + (attempt + 1) + ")");
    } catch (e) {
      Logger.log("Fetch error — " + url + " (attempt " + (attempt + 1) + "): " + e);
    }
    if (attempt < CFG.RETRY_DELAYS.length) {
      Utilities.sleep(CFG.RETRY_DELAYS[attempt]);
    }
  }
  Logger.log("Giving up on " + url);
  return null;
}


// ── HTML parsing helpers ───────────────────────────────────────

/** Strip all HTML tags and collapse whitespace. */
function stripTags(html) {
  return (html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g,  "&")
    .replace(/&lt;/g,   "<")
    .replace(/&gt;/g,   ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Return the innerHTML of the FIRST element whose class attribute
 * contains ALL of the given class tokens.
 * Uses a simple open-tag scan — does not handle deeply nested tags
 * of the same type, but is sufficient for these flat card structures.
 */
function getFirstByClasses(html, tag, classes) {
  // Build a regex that matches <tag ... class="... c1 ... c2 ..." ...>
  var classCheck = classes.map(function(c) {
    return "(?=[^>]*\\b" + c.replace(/[-]/g, "\\-") + "\\b)";
  }).join("");
  var openRe = new RegExp("<" + tag + classCheck + "[^>]*>", "i");
  var openMatch = openRe.exec(html);
  if (!openMatch) return "";
  var start = openMatch.index + openMatch[0].length;
  // Find matching close tag (non-nested search — sufficient here)
  var closeTag = "</" + tag + ">";
  var end = html.indexOf(closeTag, start);
  if (end === -1) return "";
  return html.slice(start, end);
}

/**
 * Return an array of all innerHTMLs matching the given classes.
 */
function getAllByClasses(html, tag, classes) {
  var results = [];
  var classCheck = classes.map(function(c) {
    return "(?=[^>]*\\b" + c.replace(/[-]/g, "\\-") + "\\b)";
  }).join("");
  var openRe = new RegExp("<" + tag + classCheck + "[^>]*>", "gi");
  var closeTag = "</" + tag + ">";
  var m;
  while ((m = openRe.exec(html)) !== null) {
    var start = m.index + m[0].length;
    var end   = html.indexOf(closeTag, start);
    if (end === -1) break;
    results.push(html.slice(start, end));
  }
  return results;
}

/** Extract href="..." from an anchor string. */
function getHref(anchorHtml) {
  var m = anchorHtml.match(/href=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

/** Return highest page number found in pagination links. */
function parseLastPage(html) {
  var matches = html.match(/[?&]page=(\d+)/g) || [];
  var max = 1;
  matches.forEach(function(s) {
    var n = parseInt(s.replace(/[^0-9]/g, ""), 10);
    if (n > max) max = n;
  });
  return max;
}


// ── Gazette card parser ────────────────────────────────────────

/**
 * Parse all gazette cards from a page of HTML.
 * Returns an array of row arrays aligned with HEADERS.
 * Only cards NOT already in `existingIds` are returned.
 * New IDs are added to `existingIds` in-place.
 */
function parseGazetteCards(html, existingIds) {
  var now  = new Date().toISOString();
  var rows = [];
  var chunks = html.split('<div class="col-md-12 bordered items">');

  for (var i = 1; i < chunks.length; i++) {
    var card = chunks[i];

    // Must have gazette-type to be a legal gazette card
    if (card.indexOf('class="gazette-type"') === -1) continue;

    // ── Type ──────────────────────────────────────────────────
    var typeInner = getFirstByClasses(card, "a", ["gazette-type"]);
    var type      = stripTags(typeInner);
    if (!type) continue;

    // ── Title + URL ───────────────────────────────────────────
    // <a class="gazette-title" href="https://gazette.gov.mv/gazette/7444">
    var titleRe    = /<a[^>]*class=["']gazette-title["'][^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i;
    var titleMatch = titleRe.exec(card);
    if (!titleMatch) continue;
    var rawUrl  = titleMatch[1];
    var title   = stripTags(titleMatch[2]);
    var fullUrl = rawUrl.match(/^https?:\/\//) ? rawUrl : "https://www.gazette.gov.mv" + rawUrl;
    var itemId  = rawUrl.replace(/\/$/, "").split("/").pop();

    var key = "gazette:" + itemId;
    if (existingIds[key]) continue;
    existingIds[key] = true;

    // ── Volume / Issue ────────────────────────────────────────
    // Remove the time-ago span first, then parse ވޮލިއުމް:55 އަދަދު:20
    var volDiv   = getFirstByClasses(card, "div", ["volume-info"]);
    var volClean = volDiv.replace(/<span[^>]*class=["'][^"']*info[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "");
    var volText  = stripTags(volClean);
    var volM     = volText.match(/ވޮލިއުމް\s*:?\s*(\S+)/);
    var issM     = volText.match(/އަދަދު\s*:?\s*(\S+)/);
    var volume   = volM ? volM[1] : "";
    var issue    = issM ? issM[1] : "";

    // ── Published date ────────────────────────────────────────
    var dateDivs = getAllByClasses(card, "div", ["col-md-4", "no-padding", "left", "info"]);
    var published = dateDivs[0]
      ? stripTags(dateDivs[0]).replace(/ތާރީޚު\s*:?\s*/g, "").trim()
      : "";

    // ── PDF link ──────────────────────────────────────────────
    var pdfM   = card.match(/href=["']([^"']*\.pdf[^"']*)["']/i);
    var pdfUrl = pdfM ? pdfM[1] : "";

    rows.push([itemId, "gazette", type, title, "", volume, issue, published, "", fullUrl, pdfUrl, now]);
  }

  return rows;
}


// ── Iulaan card parser ─────────────────────────────────────────

/**
 * Parse all public-announcement cards from a page of HTML.
 * Same contract as parseGazetteCards.
 */
function parseIulaanCards(html, existingIds) {
  var now  = new Date().toISOString();
  var rows = [];
  var chunks = html.split('<div class="col-md-12 bordered items">');

  for (var i = 1; i < chunks.length; i++) {
    var card = chunks[i];

    // Skip gazette cards
    if (card.indexOf('class="gazette-type"') !== -1) continue;

    // ── Detail URL + ID ───────────────────────────────────────
    // Match absolute or relative /iulaan/NUMBER links
    var detailRe    = /href=["'](?:https?:\/\/[^"']*)?\/iulaan\/(\d+)["']/i;
    var detailMatch = detailRe.exec(card);
    if (!detailMatch) continue;
    var itemId  = detailMatch[1];
    var fullUrl = "https://www.gazette.gov.mv/iulaan/" + itemId;

    var key = "iulaan:" + itemId;
    if (existingIds[key]) continue;
    existingIds[key] = true;

    // ── Type ──────────────────────────────────────────────────
    // First link inside col-md-2 div → type label
    var typeDiv  = getFirstByClasses(card, "div", ["col-md-2", "no-padding"]);
    var typeLinkM = typeDiv.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    var type     = typeLinkM ? stripTags(typeLinkM[1]) : "";

    // ── Office ────────────────────────────────────────────────
    var officeDiv   = getFirstByClasses(card, "div", ["office-info"]);
    var officeLinkM = officeDiv.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
    var office      = officeLinkM ? stripTags(officeLinkM[1]) : "";

    // ── Title ─────────────────────────────────────────────────
    // Find all links pointing to /iulaan/ID; pick first non-"read more" text
    var READ_MORE = { "އިތުރަށް ވިދާޅުވޭ": true, "ވިދާޅުވޭ": true };
    var allLinks  = card.match(/<a[^>]*\/iulaan\/\d+[^>]*>([\s\S]*?)<\/a>/gi) || [];
    var title = "";
    for (var j = 0; j < allLinks.length; j++) {
      var t = stripTags(allLinks[j]);
      if (t && !READ_MORE[t]) { title = t; break; }
    }
    if (!title && allLinks.length) title = stripTags(allLinks[0]);

    // ── Dates ─────────────────────────────────────────────────
    var dateDivs  = getAllByClasses(card, "div", ["col-md-4", "no-padding", "left", "info"]);
    var published = dateDivs[0]
      ? stripTags(dateDivs[0]).replace(/ތާރީޚު\s*:?\s*/g, "").trim()
      : "";
    var deadline  = dateDivs[1]
      ? stripTags(dateDivs[1]).replace(/ސުންގަޑި\s*:?\s*/g, "").trim()
      : "";

    rows.push([itemId, "iulaan", type, title, office, "", "", published, deadline, fullUrl, "", now]);
  }

  return rows;
}


// ── Scrape latest pages (new items → top) ─────────────────────

function scrapeNewPages(url, parser, existingIds) {
  var rows = [];
  for (var page = 1; page <= CFG.NEW_PAGES; page++) {
    var html = fetchPage(url, page);
    if (!html) continue;
    var pageRows = parser(html, existingIds);
    rows = rows.concat(pageRows);
    if (page < CFG.NEW_PAGES) Utilities.sleep(1000);
  }
  return rows;
}


// ── Scrape archive batch (old items → bottom) ─────────────────

/**
 * section: "gazette" | "iulaan"
 * Progress is stored in PropertiesService so each 15-min run
 * continues from where the last one left off.
 */
function scrapeArchiveBatch(section, url, parser, existingIds) {
  var props = PropertiesService.getScriptProperties();

  // ── Discover total page count once ────────────────────────
  var lastPage = parseInt(props.getProperty(section + "_last_page") || "0", 10);
  if (!lastPage) {
    var html = fetchPage(url, 1);
    if (!html) return [];
    lastPage = parseLastPage(html);
    props.setProperty(section + "_last_page", String(lastPage));
    Logger.log("[" + section + "] Total pages discovered: " + lastPage);
  }

  // ── Resume archive pointer ─────────────────────────────────
  var nextPage = parseInt(props.getProperty(section + "_next_archive") || "0", 10);
  if (!nextPage) nextPage = lastPage; // first time: start from oldest

  if (nextPage < 1) {
    Logger.log("[" + section + "] Archive fully crawled.");
    return [];
  }

  // ── Crawl batch (from nextPage downward) ──────────────────
  var rows    = [];
  var endPage = Math.max(1, nextPage - CFG.ARCHIVE_BATCH + 1);

  for (var page = nextPage; page >= endPage; page--) {
    Logger.log("[" + section + "] Archive page " + page + "/" + lastPage);
    var pageHtml = fetchPage(url, page);
    if (pageHtml) {
      rows = rows.concat(parser(pageHtml, existingIds));
    }
    if (page > endPage) Utilities.sleep(1000);
  }

  // Save pointer for next run
  props.setProperty(section + "_next_archive", String(endPage - 1));

  // Reverse so oldest rows end up at the very bottom
  return rows.reverse();
}


// ── Main entry point ───────────────────────────────────────────
// This is the function called by the time-driven trigger.

function main() {
  var t0    = new Date();
  var sheet = getOrCreateSheet();
  Logger.log("=== Gazette Scraper | " + t0.toISOString() + " ===");

  var existingIds = loadExistingIds(sheet);
  Logger.log("Existing entries in sheet: " + Object.keys(existingIds).length);

  // 1 ── Poll latest pages → prepend to TOP ──────────────────
  Logger.log("Polling gazette latest pages…");
  var newGazette = scrapeNewPages(CFG.GAZETTE_URL, parseGazetteCards, existingIds);

  Logger.log("Polling iulaan latest pages…");
  var newIulaan  = scrapeNewPages(CFG.IULAAN_URL,  parseIulaanCards,  existingIds);

  var newRows = newGazette.concat(newIulaan);
  if (newRows.length) {
    prependRows(sheet, newRows);
    Logger.log("Prepended " + newRows.length + " new rows at top.");
  } else {
    Logger.log("No new items found.");
  }

  // 2 ── Archive batch → append to BOTTOM ───────────────────
  Logger.log("Crawling gazette archive batch…");
  var archGazette = scrapeArchiveBatch("gazette", CFG.GAZETTE_URL, parseGazetteCards, existingIds);

  Logger.log("Crawling iulaan archive batch…");
  var archIulaan  = scrapeArchiveBatch("iulaan",  CFG.IULAAN_URL,  parseIulaanCards,  existingIds);

  var archRows = archGazette.concat(archIulaan);
  if (archRows.length) {
    appendRows(sheet, archRows);
    Logger.log("Appended " + archRows.length + " archive rows at bottom.");
  }

  var elapsed = ((new Date() - t0) / 1000).toFixed(1);
  Logger.log("Done in " + elapsed + "s | New: " + newRows.length + " | Archive: " + archRows.length);
}


// ── Trigger management ─────────────────────────────────────────

/** Install a 15-minute time-driven trigger for main(). Run once. */
function setupTrigger() {
  // Remove any existing main() triggers first
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "main") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("main")
    .timeBased()
    .everyMinutes(15)
    .create();
  Logger.log("Trigger installed: main() will run every 15 minutes.");
}

/** Stop automatic scraping. */
function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "main") {
      ScriptApp.deleteTrigger(t);
      Logger.log("Trigger removed.");
    }
  });
}

/** Reset archive progress (keeps all sheet data). */
function resetState() {
  var props = PropertiesService.getScriptProperties();
  props.deleteAllProperties();
  Logger.log("Archive state reset. Next run will restart from the oldest pages.");
}

/** Full reset: wipe sheet data, headers, and state. */
function clearSheet() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CFG.SHEET_NAME);
  if (sheet) {
    sheet.clearContents();
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    var hdr = sheet.getRange(1, 1, 1, HEADERS.length);
    hdr.setFontWeight("bold");
    hdr.setBackground("#1a73e8");
    hdr.setFontColor("#ffffff");
  }
  resetState();
  Logger.log("Sheet and state cleared.");
}
