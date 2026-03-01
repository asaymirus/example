#!/usr/bin/env python3
"""
Gazette.gov.mv continuous background scraper.

Strategy:
  - NEW entries (latest pages):  polled every POLL_INTERVAL seconds → prepended to TOP of CSV
  - OLD archive entries:          a batch of older pages crawled each cycle → appended to BOTTOM
  - State (which archive pages have been fetched) is saved to gazette_state.json

Run in the background:
  nohup python3 gazette_scraper.py &
  tail -f gazette_scraper.log          # watch progress
  cat gazette_data.csv                  # view results
"""

import csv
import json
import logging
import os
import re
import signal
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_URL           = "https://www.gazette.gov.mv"
GAZETTE_LIST_URL   = f"{BASE_URL}/gazette"
IULAAN_LIST_URL    = f"{BASE_URL}/iulaan"

OUTPUT_CSV         = Path(__file__).parent / "gazette_data.csv"
STATE_FILE         = Path(__file__).parent / "gazette_state.json"
LOG_FILE           = Path(__file__).parent / "gazette_scraper.log"

POLL_INTERVAL_SEC  = 15 * 60   # seconds between new-item polls
ARCHIVE_BATCH      = 5          # how many OLD pages to crawl per section per cycle
REQUEST_TIMEOUT    = 30
RETRY_DELAYS       = [2, 4, 8, 16]

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (compatible; GazetteArchiveScraper/1.0; "
        "+https://gazette.gov.mv)"
    )
}

CSV_FIELDS = [
    "id", "section", "type", "title", "office",
    "volume", "issue", "published_date", "deadline",
    "url", "pdf_url", "scraped_at",
]

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Graceful shutdown
# ---------------------------------------------------------------------------
_running = True

def _shutdown(signum, frame):
    global _running
    log.info("Shutdown signal received – will exit after current cycle.")
    _running = False

signal.signal(signal.SIGINT, _shutdown)
signal.signal(signal.SIGTERM, _shutdown)

# ---------------------------------------------------------------------------
# State helpers  (tracks which archive pages have been fetched)
# ---------------------------------------------------------------------------
DEFAULT_STATE = {
    "gazette": {"next_archive_page": None, "last_page": None},
    "iulaan":  {"next_archive_page": None, "last_page": None},
    "known_ids": [],   # serialised as list; loaded into a set at runtime
}

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {k: v.copy() if isinstance(v, dict) else v
            for k, v in DEFAULT_STATE.items()}

def save_state(state: dict) -> None:
    # Convert the in-memory set back to list before serialising
    out = dict(state)
    if isinstance(out.get("known_ids"), set):
        out["known_ids"] = list(out["known_ids"])
    STATE_FILE.write_text(json.dumps(out, indent=2, ensure_ascii=False))

# ---------------------------------------------------------------------------
# HTTP helper
# ---------------------------------------------------------------------------
def _get(url: str, params: dict | None = None) -> BeautifulSoup | None:
    for i, delay in enumerate(RETRY_DELAYS, 1):
        try:
            resp = requests.get(url, params=params, headers=HEADERS,
                                timeout=REQUEST_TIMEOUT)
            if resp.status_code == 200:
                return BeautifulSoup(resp.text, "lxml")
            log.warning("HTTP %s for %s (attempt %d/%d)",
                        resp.status_code, url, i, len(RETRY_DELAYS))
        except requests.RequestException as exc:
            log.warning("Request error for %s (attempt %d/%d): %s",
                        url, i, len(RETRY_DELAYS), exc)
        if i < len(RETRY_DELAYS):
            log.info("Retrying in %ds…", delay)
            time.sleep(delay)
    log.error("Giving up on %s after %d attempts.", url, len(RETRY_DELAYS))
    return None

# ---------------------------------------------------------------------------
# Page-count helper
# ---------------------------------------------------------------------------
def get_last_page(soup: BeautifulSoup) -> int:
    best = 1
    for a in soup.select("a[href*='page=']"):
        href = a.get("href", "")
        m = re.search(r"page=(\d+)", href)
        if m:
            best = max(best, int(m.group(1)))
    return best

# ---------------------------------------------------------------------------
# Parsers  (use exact CSS classes discovered from live HTML inspection)
# ---------------------------------------------------------------------------
def _clean_date(raw: str) -> str:
    """Strip the Dhivehi 'ތާރީޚު:' label prefix and extra whitespace."""
    return re.sub(r"ތާރީޚު\s*:\s*", "", raw).strip()

def _clean_deadline(raw: str) -> str:
    return re.sub(r"ސުންގަޑި\s*:\s*", "", raw).strip()

def parse_gazette_cards(soup: BeautifulSoup, section_label: str = "gazette") -> list[dict]:
    rows = []
    now = datetime.now(timezone.utc).isoformat()

    for card in soup.select("div.col-md-12.bordered.items"):
        # ---- type ----
        type_el = card.select_one("a.gazette-type")
        if not type_el:
            continue  # skip iulaan cards that appear on the homepage
        item_type = type_el.get_text(strip=True)

        # ---- volume / issue from "div.volume-info" ----
        vol_div = card.select_one("div.volume-info")
        volume, issue = "", ""
        if vol_div:
            # remove the time-ago span before reading
            for span in vol_div.select("span.info"):
                span.decompose()
            vi_text = vol_div.get_text(strip=True)
            # format: "ވޮލިއުމް:55 އަދަދު:20"
            m_vol  = re.search(r"ވޮލިއުމް\s*:?\s*(\S+)", vi_text)
            m_iss  = re.search(r"އަދަދު\s*:?\s*(\S+)", vi_text)
            volume = m_vol.group(1) if m_vol else ""
            issue  = m_iss.group(1) if m_iss else ""

        # ---- title + detail URL ----
        title_el = card.select_one("a.gazette-title")
        if not title_el:
            continue
        title    = title_el.get_text(strip=True)
        href     = title_el.get("href", "")
        full_url = href if href.startswith("http") else BASE_URL + href
        item_id  = href.rstrip("/").split("/")[-1]

        # ---- published date ----
        date_divs = card.select("div.col-md-4.no-padding.left.info")
        published = _clean_date(date_divs[0].get_text(strip=True)) if date_divs else ""

        # ---- PDF link ----
        pdf_el = card.select_one("a[href*='.pdf'], a[href*='storage.googleapis']")
        pdf_url = pdf_el.get("href", "") if pdf_el else ""

        rows.append({
            "id": item_id, "section": "gazette", "type": item_type,
            "title": title, "office": "",
            "volume": volume, "issue": issue,
            "published_date": published, "deadline": "",
            "url": full_url, "pdf_url": pdf_url, "scraped_at": now,
        })
    return rows


def parse_iulaan_cards(soup: BeautifulSoup) -> list[dict]:
    rows = []
    now = datetime.now(timezone.utc).isoformat()

    for card in soup.select("div.col-md-12.bordered.items"):
        # ---- skip gazette cards ----
        if card.select_one("a.gazette-type"):
            continue

        # ---- type: first link inside col-md-2 ----
        type_link = card.select_one("div.col-md-2.no-padding a")
        item_type = type_link.get_text(strip=True) if type_link else ""

        # ---- office: link inside office-info div ----
        office_link = card.select_one("div.office-info a")
        office = office_link.get_text(strip=True) if office_link else ""

        # ---- title + URL: first /iulaan/<id> link ----
        detail_link = card.select_one("a[href*='/iulaan/']")
        if not detail_link:
            continue
        href     = detail_link.get("href", "")
        full_url = href if href.startswith("http") else BASE_URL + href
        item_id  = href.rstrip("/").split("/")[-1]
        # try to find a more descriptive title (second /iulaan/ link)
        all_detail = card.select("a[href*='/iulaan/']")
        title = all_detail[0].get_text(strip=True) if all_detail else ""
        # the second link (if it exists and differs) is usually more descriptive
        if len(all_detail) > 1:
            t2 = all_detail[0].get_text(strip=True)
            t3 = all_detail[1].get_text(strip=True)
            # pick whichever isn't the generic "read more" text
            read_more_texts = {"އިތުރަށް ވިދާޅުވޭ", "ވިދާޅުވޭ"}
            if t2 in read_more_texts and t3 not in read_more_texts:
                title = t3
            elif t3 not in read_more_texts:
                title = t2

        # ---- dates: two "col-md-4 no-padding left info" divs ----
        date_divs = card.select("div.col-md-4.no-padding.left.info")
        published = _clean_date(date_divs[0].get_text(strip=True)) if len(date_divs) > 0 else ""
        deadline  = _clean_deadline(date_divs[1].get_text(strip=True)) if len(date_divs) > 1 else ""

        rows.append({
            "id": item_id, "section": "iulaan", "type": item_type,
            "title": title, "office": office,
            "volume": "", "issue": "",
            "published_date": published, "deadline": deadline,
            "url": full_url, "pdf_url": "", "scraped_at": now,
        })
    return rows

# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------
def load_csv_rows() -> list[dict]:
    if not OUTPUT_CSV.exists():
        return []
    with open(OUTPUT_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))

def write_csv(rows: list[dict]) -> None:
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)

# ---------------------------------------------------------------------------
# Core scrape helpers
# ---------------------------------------------------------------------------
def scrape_new_pages(list_url: str, parser, known_ids: set,
                     new_pages: int = 3) -> list[dict]:
    """Scrape the first `new_pages` pages; return only unseen rows (newest first)."""
    new_rows = []
    for page in range(1, new_pages + 1):
        if not _running:
            break
        soup = _get(list_url, params={"page": page} if page > 1 else None)
        if not soup:
            continue
        for row in parser(soup):
            key = "%s:%s" % (row["section"], row["id"])
            if key not in known_ids:
                new_rows.append(row)
                known_ids.add(key)
        time.sleep(1)
    return new_rows


def scrape_archive_batch(list_url: str, parser, section: str,
                         state: dict, known_ids: set,
                         batch: int = ARCHIVE_BATCH) -> list[dict]:
    """
    Crawl a batch of old archive pages (starting from the back).
    Updates state["<section>"]["next_archive_page"] for next call.
    Returns rows to APPEND at the bottom (oldest first within the batch).
    """
    sec = state[section]
    last_page = sec.get("last_page")

    # On first run, discover the last page
    if last_page is None:
        log.info("[%s] Discovering total page count…", section)
        soup = _get(list_url)
        if not soup:
            return []
        last_page = get_last_page(soup)
        sec["last_page"] = last_page
        log.info("[%s] Total pages: %d", section, last_page)

    # Start from the last unscraped old page
    if sec.get("next_archive_page") is None:
        sec["next_archive_page"] = last_page  # start from oldest

    start_page = sec["next_archive_page"]
    if start_page < 1:
        log.info("[%s] Archive fully crawled.", section)
        return []

    archive_rows = []
    end_page = max(1, start_page - batch + 1)
    pages_to_crawl = range(start_page, end_page - 1, -1)  # newest-of-old to oldest

    for page in pages_to_crawl:
        if not _running or page < 1:
            break
        log.info("[%s] Archive page %d/%d", section, page, last_page)
        soup = _get(list_url, params={"page": page})
        if not soup:
            continue
        for row in parser(soup):
            key = "%s:%s" % (row["section"], row["id"])
            if key not in known_ids:
                archive_rows.append(row)
                known_ids.add(key)
        time.sleep(1)

    # Move pointer backwards for next cycle
    sec["next_archive_page"] = end_page - 1

    # Return oldest-first so they end up at the bottom in correct order
    return list(reversed(archive_rows))

# ---------------------------------------------------------------------------
# Main loop
# ---------------------------------------------------------------------------
def main():
    log.info("=" * 60)
    log.info("Gazette.gov.mv scraper started")
    log.info("CSV    : %s", OUTPUT_CSV)
    log.info("Log    : %s", LOG_FILE)
    log.info("State  : %s", STATE_FILE)
    log.info("Poll   : every %d min | Archive batch: %d pages/section/cycle",
             POLL_INTERVAL_SEC // 60, ARCHIVE_BATCH)
    log.info("=" * 60)

    state = load_state()
    known_ids: set[str] = set(state.get("known_ids", []))

    # Sync known_ids with whatever is already in the CSV
    for row in load_csv_rows():
        known_ids.add("%s:%s" % (row.get("section",""), row.get("id","")))
    log.info("Loaded %d known entries.", len(known_ids))

    cycle = 0
    while _running:
        cycle += 1
        log.info("=== Cycle %d  (%s) ===", cycle, datetime.now().isoformat(timespec="seconds"))

        # ── 1. Poll for NEW items (prepend to top) ──────────────────────────
        new_gazette = []
        new_iulaan  = []
        try:
            log.info("Polling gazette new pages…")
            new_gazette = scrape_new_pages(GAZETTE_LIST_URL, parse_gazette_cards, known_ids)
            log.info("Polling iulaan new pages…")
            new_iulaan  = scrape_new_pages(IULAAN_LIST_URL,  parse_iulaan_cards,  known_ids)
        except Exception as exc:
            log.error("Error during new-page poll: %s", exc, exc_info=True)

        new_rows = new_gazette + new_iulaan  # both newest-first
        if new_rows:
            log.info("Found %d new items → prepending to top of CSV.", len(new_rows))
            existing = load_csv_rows()
            write_csv(new_rows + existing)

        # ── 2. Crawl OLD archive pages (append to bottom) ──────────────────
        archive_gazette = []
        archive_iulaan  = []
        try:
            log.info("Crawling gazette archive batch…")
            archive_gazette = scrape_archive_batch(
                GAZETTE_LIST_URL, parse_gazette_cards, "gazette", state, known_ids)
            if _running:
                log.info("Crawling iulaan archive batch…")
                archive_iulaan = scrape_archive_batch(
                    IULAAN_LIST_URL, parse_iulaan_cards, "iulaan", state, known_ids)
        except Exception as exc:
            log.error("Error during archive crawl: %s", exc, exc_info=True)

        archive_rows = archive_gazette + archive_iulaan
        if archive_rows:
            log.info("Fetched %d archive items → appending to bottom of CSV.", len(archive_rows))
            existing = load_csv_rows()
            write_csv(existing + archive_rows)

        if not new_rows and not archive_rows:
            log.info("Nothing new this cycle.")

        # ── 3. Persist state ────────────────────────────────────────────────
        state["known_ids"] = known_ids
        try:
            save_state(state)
        except Exception as exc:
            log.error("Failed to save state: %s", exc)

        log.info(
            "Cycle %d done. CSV has ~%d rows. Sleeping %d min…",
            cycle,
            len(known_ids),
            POLL_INTERVAL_SEC // 60,
        )

        if not _running:
            break

        # Interruptible sleep
        elapsed = 0
        while elapsed < POLL_INTERVAL_SEC and _running:
            time.sleep(min(5, POLL_INTERVAL_SEC - elapsed))
            elapsed += 5

    log.info("Scraper exited cleanly.")


if __name__ == "__main__":
    main()
