/**
 * Netlify Function: gazette-rss
 *
 * Scrapes https://gazette.gov.mv/gazette and returns an RSS 2.0 feed.
 * Endpoint: /.netlify/functions/gazette-rss
 * Optional query params:
 *   ?type=gaanoonu|gavaaidhu|garaaru|usoolu|tax-ruling  (filter by type)
 *   ?page=N  (page number, default 1)
 */

const https = require('https');

// Dhivehi month names → month index (1-based)
const DHIVEHI_MONTHS = {
  'ޖެނުއަރީ': 1,
  'ފެބުރުވަރީ': 2,
  'މާރިޗު': 3,
  'އޭޕްރިލް': 4,
  'މެއި': 5,
  'ޖޫން': 6,
  'ޖުލައި': 7,
  'އޯގަސްޓު': 8,
  'ސެޕްޓެންބަރ': 9,
  'އޮކްޓޯބަރ': 10,
  'ނޮވެންބަރ': 11,
  'ޑިސެންބަރ': 12,
};

// Dhivehi relative-time units → milliseconds
const DHIVEHI_UNITS = {
  'ދުވަސް': 24 * 60 * 60 * 1000,       // days
  'ހަފްތާ': 7 * 24 * 60 * 60 * 1000,   // weeks
  'މަސް': 30 * 24 * 60 * 60 * 1000,    // months (approx)
  'އަހަރު': 365 * 24 * 60 * 60 * 1000, // years (approx)
  'ގަޑިއިރު': 60 * 60 * 1000,          // hours
  'މިނިޓު': 60 * 1000,                  // minutes
};

/**
 * Parse a Dhivehi relative-time string like "3 ދުވަސް ކުރިން"
 * and return an approximate Date object.
 */
function parseRelativeDate(relStr) {
  const trimmed = (relStr || '').trim();
  const match = trimmed.match(/(\d+)\s+(\S+)\s+ކުރިން/);
  if (!match) return new Date();
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  const ms = DHIVEHI_UNITS[unit];
  if (!ms) return new Date();
  return new Date(Date.now() - amount * ms);
}

/**
 * Parse a Dhivehi absolute date string like "18 ފެބުރުވަރީ 2026"
 * and return a Date object, or null if unrecognised.
 */
function parseDhivehiDate(dateStr, timeStr) {
  const trimmed = (dateStr || '').trim();
  const match = trimmed.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const monthNum = DHIVEHI_MONTHS[match[2]];
  const year = parseInt(match[3], 10);
  if (!monthNum) return null;
  if (timeStr) {
    const timeParts = timeStr.trim().match(/(\d{2}):(\d{2})/);
    if (timeParts) {
      return new Date(year, monthNum - 1, day, parseInt(timeParts[1], 10), parseInt(timeParts[2], 10));
    }
  }
  return new Date(year, monthNum - 1, day);
}

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'gazette-rss-bot/1.0' } }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Parse gazette listing HTML into an array of entry objects.
 */
function parseGazetteEntries(html) {
  const entries = [];

  // Each entry block starts with class="bordered items"
  // Pattern: extract blocks between "bordered items" markers
  const blockRe = /class="col-md-12 bordered items">([\s\S]*?)(?=class="col-md-12 bordered items"|<div class="pagination|<\/div>\s*<\/div>\s*<\/div>\s*<\/section)/g;
  let blockMatch;

  while ((blockMatch = blockRe.exec(html)) !== null) {
    // Strip HTML comments so we don't match commented-out duplicate elements
    const block = blockMatch[1].replace(/<!--[\s\S]*?-->/g, '');

    // Type — match the visible (non-commented) gazette-type anchor
    const typeMatch = block.match(/class="gazette-type"[^>]*>\s*([\s\S]*?)\s*<\/a>/);
    const type = typeMatch ? typeMatch[1].trim() : '';

    // Volume/issue and relative date (class may be "col-md-10 no-padding volume-info")
    const volMatch = block.match(/class="[^"]*volume-info[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const volText = volMatch ? volMatch[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').trim() : '';
    const relDateMatch = block.match(/class="info"\s*>\.\s*([\s\S]*?)<\/span>/);
    const relDateStr = relDateMatch ? relDateMatch[1].trim() : '';
    const pubDate = parseRelativeDate(relDateStr);

    // Title and URL
    const titleMatch = block.match(/class="gazette-title"\s+href="([^"]+)"\s+title="([^"]+)"/);
    if (!titleMatch) continue;
    const url = titleMatch[1];
    const title = titleMatch[2];

    // PDF link
    const pdfMatch = block.match(/class="read-more"\s+href="([^"]+\.pdf)"/);
    const pdfUrl = pdfMatch ? pdfMatch[1] : null;

    // Extract volume and issue numbers from volText
    // e.g. "ވޮލިއުމް:  55   އަދަދު:  11"
    const volNum = (volText.match(/ވޮލިއުމް:\s*(\d+)/) || [])[1] || '';
    const issueNum = (volText.match(/އަދަދު:\s*(\d+)/) || [])[1] || '';

    entries.push({ title, url, type, pubDate, pdfUrl, volNum, issueNum });
  }

  return entries;
}

/**
 * Build an RSS 2.0 XML string from parsed gazette entries.
 */
function buildRss(entries, feedUrl, filterType) {
  const typeLabel = filterType ? ` (${filterType})` : '';
  const now = new Date().toUTCString();

  const items = entries.map((e) => {
    const description = [
      e.type ? `Type: ${e.type}` : '',
      e.volNum ? `Volume: ${e.volNum}` : '',
      e.issueNum ? `Issue: ${e.issueNum}` : '',
      e.pdfUrl ? `<a href="${escapeXml(e.pdfUrl)}">Download PDF</a>` : '',
    ].filter(Boolean).join(' | ');

    return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${escapeXml(e.url)}</link>
      <guid isPermaLink="true">${escapeXml(e.url)}</guid>
      <pubDate>${e.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(description)}</description>
      ${e.pdfUrl ? `<enclosure url="${escapeXml(e.pdfUrl)}" type="application/pdf" length="0"/>` : ''}
    </item>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Maldives Government Gazette${escapeXml(typeLabel)}</title>
    <link>https://gazette.gov.mv/gazette${filterType ? `?type=${filterType}` : ''}</link>
    <description>Official Gazette of the Republic of Maldives — laws, regulations, decrees, and guidelines.</description>
    <language>dv</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

exports.handler = async (event) => {
  const params = event.queryStringParameters || {};
  const filterType = params.type || '';
  const page = parseInt(params.page || '1', 10);

  let sourceUrl = `https://www.gazette.gov.mv/gazette?page=${page}`;
  if (filterType) sourceUrl += `&type=${encodeURIComponent(filterType)}`;

  let html;
  try {
    html = await fetchPage(sourceUrl);
  } catch (err) {
    return {
      statusCode: 502,
      body: `Failed to fetch gazette: ${err.message}`,
    };
  }

  const entries = parseGazetteEntries(html);

  const selfUrl = `https://gazette.gov.mv/.netlify/functions/gazette-rss${filterType ? `?type=${filterType}` : ''}`;
  const rss = buildRss(entries, selfUrl, filterType);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800', // cache 30 minutes
    },
    body: rss,
  };
};
