/**
 * Gazette.gov.mv — Announcements (Iulaan) Scraper
 * Google Apps Script
 *
 * Scrapes https://gazette.gov.mv/iulaan and writes every announcement
 * (title, URL, office, published date, deadline, type) to this spreadsheet.
 *
 * HOW TO USE
 * ----------
 * 1. Open a Google Sheet.
 * 2. Go to Extensions > Apps Script and paste this whole file.
 * 3. Run `startScrape()` to begin from page 1.
 *    – The script writes rows in batches and sets a 1-minute time trigger
 *      to resume automatically (Google limits each run to ~6 min).
 *    – Check progress in the "Log" sheet or via View > Executions.
 * 4. To stop early, run `stopScrape()`.
 * 5. To resume a paused/errored run, run `resumeScrape()`.
 *
 * FILTER OPTIONS (optional)
 * -------------------------
 * Pass a type slug to `startScrape()` or set CONFIG.type below:
 *   vazeefaa     – Job opportunities
 *   mubaaraaiy   – Tenders / competitions
 *   insurance    – Insurance notices
 *   noosbayaan   – Public notices
 *   (leave blank for all announcements)
 *
 * You can also set CONFIG.office to an office slug to filter by office,
 * e.g. 'ministry-of-education'.
 */

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  type:         '',          // announcement type filter (blank = all)
  office:       '',          // office slug filter       (blank = all)
  startPage:    1,           // first page to scrape
  maxPages:     33035,       // gazette.gov.mv has ~33 035 pages (330 343 entries)
  batchSize:    20,          // pages to fetch per execution before saving & yielding
  sheetName:    'Announcements',
  logSheetName: 'Log',
  resumeKey:    'IULAAN_NEXT_PAGE',
  runningKey:   'IULAAN_RUNNING',
  triggerKey:   'IULAAN_TRIGGER_ID',
};

// ─── Dhivehi month map ────────────────────────────────────────────────────────
const DHIVEHI_MONTHS = {
  'ޖެނުއަރީ':  1, 'ފެބުރުވަރީ': 2, 'މާރިޗު':     3,
  'އޭޕްރިލް':  4, 'މެއި':        5, 'ޖޫން':        6,
  'ޖުލައި':    7, 'އޯގަސްޓު':    8, 'ސެޕްޓެންބަރ': 9,
  'އޮކްޓޯބަރ': 10,'ނޮވެންބަރ':  11,'ޑިސެންބަރ':  12,
};

// ─── Public entry points ───────────────────────────────────────────────────────

/** Start a fresh scrape from page 1 (clears existing data). */
function startScrape(type, office) {
  const props = PropertiesService.getScriptProperties();
  stopScrape(); // cancel any running trigger first

  const cfg = Object.assign({}, CONFIG, {
    type:   type   || CONFIG.type,
    office: office || CONFIG.office,
  });

  props.setProperties({
    [CONFIG.resumeKey]:  String(cfg.startPage),
    [CONFIG.runningKey]: 'true',
    IULAAN_TYPE:         cfg.type,
    IULAAN_OFFICE:       cfg.office,
  });

  _setupSheet(cfg);
  _log('Started scrape from page ' + cfg.startPage +
       (cfg.type   ? ' [type='   + cfg.type   + ']' : '') +
       (cfg.office ? ' [office=' + cfg.office + ']' : ''));

  _runBatch(); // run first batch immediately
}

/** Resume from where the last run left off. */
function resumeScrape() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(CONFIG.runningKey, 'true');
  _log('Resuming scrape');
  _runBatch();
}

/** Stop scraping and remove the auto-resume trigger. */
function stopScrape() {
  const props = PropertiesService.getScriptProperties();
  props.setProperty(CONFIG.runningKey, 'false');
  _deleteTrigger();
  _log('Scrape stopped');
}

// ─── Internal: batch execution ─────────────────────────────────────────────────

/**
 * Called by the time trigger. Fetches CONFIG.batchSize pages, appends rows,
 * then either schedules the next trigger or marks complete.
 */
function _runBatch() {
  const props  = PropertiesService.getScriptProperties();
  if (props.getProperty(CONFIG.runningKey) !== 'true') return;

  const type   = props.getProperty('IULAAN_TYPE')   || CONFIG.type;
  const office = props.getProperty('IULAAN_OFFICE') || CONFIG.office;
  let   page   = parseInt(props.getProperty(CONFIG.resumeKey) || CONFIG.startPage, 10);

  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.sheetName);
  const rows  = [];
  const end   = Math.min(page + CONFIG.batchSize - 1, CONFIG.maxPages);

  _log('Fetching pages ' + page + '–' + end + ' …');

  for (let p = page; p <= end; p++) {
    try {
      const html    = _fetchPage(p, type, office);
      const entries = _parseEntries(html);
      if (entries.length === 0 && p > 1) {
        // Empty page past page 1 likely means we've exhausted results
        _log('No entries on page ' + p + ' — stopping.');
        props.setProperty(CONFIG.runningKey, 'false');
        _deleteTrigger();
        _log('✅ Scrape complete. Last page: ' + (p - 1));
        _flushRows(sheet, rows);
        return;
      }
      entries.forEach(e => rows.push([
        e.title,
        e.url,
        e.officeName,
        e.dateStr,
        e.deadline,
        e.type,
        e.url,             // hyperlink formula column
      ]));
    } catch (err) {
      _log('Error on page ' + p + ': ' + err.message);
      // Save progress and retry next trigger
      props.setProperty(CONFIG.resumeKey, String(p));
      _flushRows(sheet, rows);
      _scheduleNextTrigger();
      return;
    }
    Utilities.sleep(300); // be polite — ~300 ms between requests
  }

  _flushRows(sheet, rows);
  page = end + 1;

  if (page > CONFIG.maxPages) {
    props.setProperty(CONFIG.runningKey, 'false');
    _deleteTrigger();
    _log('✅ Scrape complete. All ' + CONFIG.maxPages + ' pages processed.');
  } else {
    props.setProperty(CONFIG.resumeKey, String(page));
    _log('Progress saved at page ' + page + '. Scheduling next run…');
    _scheduleNextTrigger();
  }
}

// ─── Internal: sheet helpers ───────────────────────────────────────────────────

function _setupSheet(cfg) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cfg.sheetName);
  if (sheet) {
    sheet.clearContents();
  } else {
    sheet = ss.insertSheet(cfg.sheetName);
  }

  // Header row
  const headers = ['Title', 'URL', 'Office', 'Published', 'Deadline', 'Type', 'Open'];
  sheet.appendRow(headers);

  // Formatting
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 400); // Title
  sheet.setColumnWidth(2, 300); // URL
  sheet.setColumnWidth(3, 250); // Office
  sheet.setColumnWidth(4, 130); // Published
  sheet.setColumnWidth(5, 170); // Deadline
  sheet.setColumnWidth(6, 120); // Type
  sheet.setColumnWidth(7, 70);  // Open

  SpreadsheetApp.flush();
}

function _flushRows(sheet, rows) {
  if (rows.length === 0) return;

  const startRow = sheet.getLastRow() + 1;

  // Write data columns (A–F)
  const dataRows = rows.map(r => r.slice(0, 6));
  sheet.getRange(startRow, 1, dataRows.length, 6).setValues(dataRows);

  // Write HYPERLINK formulas in column G
  const linkFormulas = rows.map(r => [`=HYPERLINK("${r[6].replace(/"/g, '""')}","Open")`]);
  sheet.getRange(startRow, 7, linkFormulas.length, 1).setFormulas(linkFormulas);

  SpreadsheetApp.flush();
  _log('Wrote ' + rows.length + ' rows (total rows: ' + sheet.getLastRow() + ')');
}

// ─── Internal: trigger management ─────────────────────────────────────────────

function _scheduleNextTrigger() {
  _deleteTrigger(); // remove old one first
  const trigger = ScriptApp.newTrigger('_runBatch')
    .timeBased()
    .after(60 * 1000) // 1 minute
    .create();
  PropertiesService.getScriptProperties()
    .setProperty(CONFIG.triggerKey, trigger.getUniqueId());
}

function _deleteTrigger() {
  const props     = PropertiesService.getScriptProperties();
  const triggerId = props.getProperty(CONFIG.triggerKey);
  ScriptApp.getProjectTriggers().forEach(t => {
    if (!triggerId || t.getUniqueId() === triggerId) {
      ScriptApp.deleteTrigger(t);
    }
  });
  props.deleteProperty(CONFIG.triggerKey);
}

// ─── Internal: HTTP fetch ──────────────────────────────────────────────────────

function _fetchPage(page, type, office) {
  const params = ['page=' + page];
  if (type)   params.push('type='   + encodeURIComponent(type));
  if (office) params.push('office=' + encodeURIComponent(office));
  const url = 'https://www.gazette.gov.mv/iulaan?' + params.join('&');

  const response = UrlFetchApp.fetch(url, {
    headers: { 'User-Agent': 'gazette-sheet-bot/1.0' },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('HTTP ' + response.getResponseCode() + ' for ' + url);
  }
  return response.getContentText('UTF-8');
}

// ─── Internal: HTML parser ─────────────────────────────────────────────────────

function _parseEntries(html) {
  const entries = [];

  const officeMatches = _matchAll(html, /class="iulaan-office"[^>]*href='([^']*)'[^>]*>\s*([\s\S]*?)\s*<\/a>/g);
  const titleMatches  = _matchAll(html, /class="iulaan-title"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g);
  const typeMatches   = _matchAll(html, /class="iulaan-type"[^>]*>\s*([\s\S]*?)\s*<\/a>/g);

  const count = Math.min(officeMatches.length, titleMatches.length);
  for (let i = 0; i < count; i++) {
    const officeMatch = officeMatches[i];
    const titleMatch  = titleMatches[i];

    const officeName = _stripHtml(officeMatch[2]);
    const url        = titleMatch[1];
    const title      = _stripHtml(titleMatch[2]);

    // Slice of HTML after this title's anchor up to the next office anchor
    const titleEnd       = titleMatch.index + titleMatch[0].length;
    const nextOfficeIdx  = officeMatches[i + 1] ? officeMatches[i + 1].index : html.length;
    const block          = html.slice(titleEnd, nextOfficeIdx);

    // Published date  (ތާރީޚު: DD Month YYYY)
    const dateM   = block.match(/ތާރީޚު:\s*([\s\S]*?)(?=ސުންގަޑި:|<\/div>)/);
    const dateStr = dateM ? _stripHtml(dateM[1]) : '';

    // Deadline  (ސުންގަޑި: DD Month YYYY HH:MM)
    const dlM      = block.match(/ސުންގަޑި:\s*([\s\S]*?)(?=<\/div>)/);
    const deadline = dlM ? _stripHtml(dlM[1]) : '';

    // Announcement type label (if present)
    const typeLabel = typeMatches[i] ? _stripHtml(typeMatches[i][1]) : '';

    entries.push({ title, url, officeName, dateStr, deadline, type: typeLabel });
  }
  return entries;
}

/** Polyfill for String.matchAll (GAS doesn't always have it). */
function _matchAll(str, re) {
  const results = [];
  let m;
  // Re-use a global regex safely
  const globalRe = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
  globalRe.lastIndex = 0;
  while ((m = globalRe.exec(str)) !== null) {
    m.index = globalRe.lastIndex - m[0].length;
    results.push(m);
  }
  return results;
}

function _stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─── Internal: log sheet ──────────────────────────────────────────────────────

function _log(message) {
  Logger.log(message);
  try {
    const ss    = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName(CONFIG.logSheetName);
    if (!logSheet) {
      logSheet = ss.insertSheet(CONFIG.logSheetName);
      logSheet.appendRow(['Timestamp', 'Message']);
      logSheet.getRange(1, 1, 1, 2).setFontWeight('bold');
    }
    logSheet.appendRow([new Date(), message]);
  } catch (_) { /* ignore logging errors */ }
}
