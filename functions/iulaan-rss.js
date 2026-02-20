/**
 * Netlify Function: iulaan-rss
 *
 * Scrapes https://gazette.gov.mv/iulaan and returns an RSS 2.0 feed.
 * Endpoint: /.netlify/functions/iulaan-rss
 * Optional query params:
 *   ?type=vazeefaa|mubaaraaiy|insurance|...  (filter by announcement type)
 *   ?office=<office-slug>                     (filter by office)
 *   ?page=N                                   (page number, default 1)
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

/**
 * Parse a Dhivehi absolute date string like "20 ފެބުރުވަރީ 2026"
 * Returns a Date, or new Date() (now) if unrecognised.
 */
function parseDhivehiDate(dateStr) {
  const trimmed = (dateStr || '').trim();
  const match = trimmed.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (!match) return new Date();
  const day = parseInt(match[1], 10);
  const monthNum = DHIVEHI_MONTHS[match[2]];
  const year = parseInt(match[3], 10);
  if (!monthNum) return new Date();
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
 * Strip HTML tags and normalise whitespace.
 */
function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Parse iulaan listing HTML into an array of entry objects.
 *
 * Each entry on the page has the pattern:
 *   1. div.office-info > a.iulaan-office (office name + slug)
 *                       span.info (relative time)
 *   2. div > a.iulaan-title (title + URL)
 *   3. <hr>
 *   4. div > div.info (ތާރީޚު: DATE)
 *            div.info (ސުންގަޑި: DEADLINE)
 *            div > a.read-more
 */
function parseIulaanEntries(html) {
  const entries = [];

  // Split on the office-info divs which start each entry
  // We use the iulaan-office anchor as the entry boundary
  const officeRe = /class="iulaan-office"[^>]*href='([^']*)'[^>]*>\s*([\s\S]*?)\s*<\/a>/g;
  const titleRe = /class="iulaan-title"\s+href="([^"]+)"[^>]*>\s*([\s\S]*?)\s*<\/a>/g;
  const dateBlockRe = /ތާރީޚު:\s*([\s\S]*?)(?=ސުންގަޑި:|<div class="col-md-4)/;
  const deadlineRe = /ސުންގަޑި:\s*([\d\s\S]*?)(?=<\/div>)/;

  // Locate all office entries and their positions
  const officeMatches = [...html.matchAll(/class="iulaan-office"[^>]*href='([^']*)'[^>]*>\s*([\s\S]*?)\s*<\/a>/g)];
  const titleMatches = [...html.matchAll(/class="iulaan-title"\s+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];

  // Pair offices with titles by proximity
  const count = Math.min(officeMatches.length, titleMatches.length);
  for (let i = 0; i < count; i++) {
    const officeMatch = officeMatches[i];
    const titleMatch = titleMatches[i];

    const officeSlug = officeMatch[1];
    const officeName = stripHtml(officeMatch[2]);
    const url = titleMatch[1];
    const title = stripHtml(titleMatch[2]);

    // Get the block of HTML between this title and the next office entry
    const titleEnd = titleMatch.index + titleMatch[0].length;
    const nextOfficeStart = officeMatches[i + 1] ? officeMatches[i + 1].index : html.length;
    const block = html.slice(titleEnd, nextOfficeStart);

    // Extract publication date
    const dateM = block.match(/ތާރީޚު:\s*([\s\S]*?)(?=ސުންގަޑި:|<\/div>)/);
    const dateStr = dateM ? stripHtml(dateM[1]) : '';
    const pubDate = parseDhivehiDate(dateStr);

    // Extract deadline
    const dlM = block.match(/ސުންގަޑި:\s*([\s\S]*?)(?=<\/div>)/);
    const deadline = dlM ? stripHtml(dlM[1]) : '';

    entries.push({ title, url, officeName, officeSlug, pubDate, dateStr, deadline });
  }

  return entries;
}

/**
 * Build an RSS 2.0 XML string from parsed iulaan entries.
 */
function buildRss(entries, feedUrl, filterType, filterOffice) {
  const suffix = [
    filterType ? `type=${filterType}` : '',
    filterOffice ? `office=${filterOffice}` : '',
  ].filter(Boolean).join(', ');
  const titleSuffix = suffix ? ` (${suffix})` : '';
  const now = new Date().toUTCString();

  const items = entries.map((e) => {
    const descParts = [
      e.officeName ? `Office: ${e.officeName}` : '',
      e.dateStr ? `Published: ${e.dateStr}` : '',
      e.deadline ? `Deadline: ${e.deadline}` : '',
    ].filter(Boolean);

    return `    <item>
      <title>${escapeXml(e.title)}</title>
      <link>${escapeXml(e.url)}</link>
      <guid isPermaLink="true">${escapeXml(e.url)}</guid>
      <pubDate>${e.pubDate.toUTCString()}</pubDate>
      <description>${escapeXml(descParts.join(' | '))}</description>
      <author>${escapeXml(e.officeName)}</author>
    </item>`;
  }).join('\n');

  const qs = [
    filterType ? `type=${filterType}` : '',
    filterOffice ? `office=${filterOffice}` : '',
  ].filter(Boolean).join('&');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Maldives Government Gazette — Announcements${escapeXml(titleSuffix)}</title>
    <link>https://gazette.gov.mv/iulaan${qs ? `?${qs}` : ''}</link>
    <description>Official announcements from the Government of Maldives — tenders, jobs, public notices, and more.</description>
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
  const filterOffice = params.office || '';
  const page = parseInt(params.page || '1', 10);

  const qsParts = [`page=${page}`];
  if (filterType) qsParts.push(`type=${encodeURIComponent(filterType)}`);
  if (filterOffice) qsParts.push(`office=${encodeURIComponent(filterOffice)}`);
  const sourceUrl = `https://www.gazette.gov.mv/iulaan?${qsParts.join('&')}`;

  let html;
  try {
    html = await fetchPage(sourceUrl);
  } catch (err) {
    return {
      statusCode: 502,
      body: `Failed to fetch iulaan: ${err.message}`,
    };
  }

  const entries = parseIulaanEntries(html);

  const selfQs = [
    filterType ? `type=${filterType}` : '',
    filterOffice ? `office=${filterOffice}` : '',
  ].filter(Boolean).join('&');
  const selfUrl = `https://gazette.gov.mv/.netlify/functions/iulaan-rss${selfQs ? `?${selfQs}` : ''}`;

  const rss = buildRss(entries, selfUrl, filterType, filterOffice);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=1800', // cache 30 minutes
    },
    body: rss,
  };
};
