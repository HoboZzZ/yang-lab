#!/usr/bin/env python3
"""Build data/citations.json from ORCID profiles and optional DOI sources.

This is the Hugo equivalent of the Greene Lab citations component:
https://greene-lab.gitbook.io/lab-website-template-docs/basics/citations
"""

import json
import re
import time
import urllib.parse
import urllib.request
from difflib import SequenceMatcher
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCES = ROOT / "cite" / "sources.yaml"
MANUAL = ROOT / "data" / "publications.json"
OUTPUT = ROOT / "data" / "citations.json"
UA = "yang-lab-citations/1.0 (mailto:yang8905@umn.edu)"
MIN_YEAR = 2010


def get(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as response:
        return json.load(response)


def clean(text):
    text = re.sub(r"<[^>]+>", "", text or "")
    return re.sub(r"\s+", " ", text).replace("\u00a0", " ").strip()


def norm(text):
    return re.sub(r"[^a-z0-9]+", "", clean(text).lower())


def initials(given):
    parts = re.findall(r"[A-Za-z]+", given or "")
    return "".join(part[0].upper() + "." for part in parts)


def join_authors(names):
    names = [name for name in names if name]
    if not names:
        return ""
    if len(names) == 1:
        return names[0]
    if len(names) == 2:
        return f"{names[0]} and {names[1]}"
    return ", ".join(names[:-1]) + " and " + names[-1]


def load_sources(path):
    orcids, dois = [], []
    if not path.exists():
        return orcids, dois
    for raw in path.read_text().splitlines():
        line = raw.split("#", 1)[0].strip()
        if line.startswith("- orcid:"):
            orcids.append(line.split(":", 1)[1].strip().strip("\"'"))
        elif line.startswith("- id:"):
            value = line.split(":", 1)[1].strip().strip("\"'")
            value = re.sub(r"^https?://(dx\.)?doi\.org/", "", value)
            if value:
                dois.append(value)
    return orcids, dois


def doi_of(work):
    for ext in ((work.get("external-ids") or {}).get("external-id") or []):
        if ext.get("external-id-type") == "doi" and ext.get("external-id-value"):
            return ext["external-id-value"].strip()
    return ""


def orcid_works(orcid):
    summary = get(f"https://pub.orcid.org/v3.0/{orcid}/works")
    codes = []
    for group in summary.get("group") or []:
        work = group["work-summary"][0]
        if work.get("type") not in (None, "journal-article"):
            continue
        codes.append(str(work["put-code"]))
    details = {}
    for start in range(0, len(codes), 20):
        batch = ",".join(codes[start:start + 20])
        data = get(f"https://pub.orcid.org/v3.0/{orcid}/works/{batch}")
        for item in data.get("bulk") or []:
            work = item.get("work")
            if work:
                details[str(work["put-code"])] = work
        time.sleep(0.15)
    return [details[code] for code in codes if code in details]


def crossref(doi):
    url = "https://api.crossref.org/works/" + urllib.parse.quote(doi)
    try:
        return get(url)["message"]
    except Exception as error:
        print(f"crossref miss {doi}: {error}")
        return None


def from_crossref(msg, doi):
    names = []
    for author in msg.get("author") or []:
        if author.get("family") and author.get("given"):
            names.append(f"{author['family']}, {initials(author['given'])}")
        else:
            names.append(author.get("name") or author.get("family") or "")
    container = clean((msg.get("container-title") or [""])[0])
    volume = msg.get("volume") or ""
    page = msg.get("page") or ""
    journal = container
    if volume and page:
        journal = f"{container}, {volume}: {page}"
    elif volume:
        journal = f"{container}, {volume}"
    year = None
    parts = (msg.get("issued") or {}).get("date-parts") or []
    if parts and parts[0]:
        year = int(parts[0][0])
    return {
        "year": year,
        "authors": join_authors(names),
        "title": clean(msg.get("title", [""])[0]).rstrip("."),
        "journal": journal,
        "doi": doi,
        "url": msg.get("URL") or f"https://doi.org/{doi}",
        "note": "",
    }


def from_orcid(work):
    doi = doi_of(work)
    names = []
    for contributor in ((work.get("contributors") or {}).get("contributor") or []):
        names.append(clean((contributor.get("credit-name") or {}).get("value")))
    year = (((work.get("publication-date") or {}).get("year") or {}).get("value"))
    url = clean(((work.get("url") or {}).get("value")))
    return {
        "year": int(year) if year else None,
        "authors": join_authors(names),
        "title": clean((((work.get("title") or {}).get("title") or {}).get("value"))).rstrip("."),
        "journal": clean((work.get("journal-title") or {}).get("value")),
        "doi": doi,
        "url": url or (f"https://doi.org/{doi}" if doi else ""),
        "note": "",
    }


def merge_manual(items, entries):
    """Keep the curated archive and its author annotations during every sync."""
    by_key = {}

    def keys(item):
        result = [norm(item.get("title", ""))]
        if item.get("doi"):
            result.insert(0, item["doi"].lower())
        result.extend(norm(title) for title in item.get("title_aliases", []))
        return [key for key in result if key]

    def index(item):
        for key in keys(item):
            by_key[key] = item

    for item in items:
        index(item)
    for entry in entries:
        if not entry.get("title") or not entry.get("year"):
            continue
        matches = {id(by_key[key]): by_key[key] for key in keys(entry) if key in by_key}
        current = next(iter(matches.values()), None)
        curated = {key: value for key, value in entry.items() if value is not None and value != ""}
        curated["title"] = clean(entry["title"]).rstrip(".")
        curated["year"] = int(entry["year"])
        if current is None:
            current = curated
            items.append(current)
        else:
            current.update(curated)
            items[:] = [item for item in items if id(item) not in matches or item is current]
        index(current)
    return items


def main():
    orcids, extra_dois = load_sources(SOURCES)
    items = []
    seen = set()

    def add(item):
        if not item.get("title") or not item.get("year"):
            return
        key = item["doi"].lower() if item.get("doi") else norm(item["title"])
        if key in seen:
            return
        seen.add(key)
        items.append(item)

    for orcid in orcids:
        for work in orcid_works(orcid):
            doi = doi_of(work)
            msg = crossref(doi) if doi else None
            if doi:
                time.sleep(0.05)
            item = from_crossref(msg, doi) if msg else from_orcid(work)
            if not item.get("authors"):
                item["authors"] = from_orcid(work)["authors"]
            if not item.get("year"):
                item["year"] = from_orcid(work)["year"]
            add(item)

    for doi in extra_dois:
        if doi.lower() in seen:
            continue
        msg = crossref(doi)
        if msg:
            add(from_crossref(msg, doi))

    if MANUAL.exists():
        manual = json.loads(MANUAL.read_text(encoding="utf-8"))
        items = merge_manual(items, manual.get("items") or [])

    items = [item for item in items if item["year"] >= MIN_YEAR]
    items.sort(key=lambda item: (-item["year"], item["title"].lower()))
    items = dedupe(items)
    OUTPUT.write_text(json.dumps({"items": items}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {len(items)} citations to {OUTPUT}")


def loose(title):
    text = clean(title).lower().replace("‐", "-").replace("–", "-").replace("—", "-")
    return re.sub(r"[^a-z0-9]+", "", text)


def dedupe(items):
    kept = []
    for item in sorted(items, key=lambda entry: (entry["year"], 0 if entry.get("doi") else 1)):
        key = loose(item["title"])
        match = next((prev for prev in kept if prev["year"] == item["year"] and SequenceMatcher(None, loose(prev["title"]), key).ratio() >= 0.84), None)
        if match:
            if item.get("author_mark_source") == "lab-publication-list":
                for field in ("author_list", "author_mark_source", "authors", "source_url"):
                    if field in item:
                        match[field] = item[field]
            if item.get("note") and not match.get("note"):
                match["note"] = item["note"]
            if item.get("doi") and not match.get("doi"):
                note = match.get("note") or item.get("note") or ""
                match.update({field: item[field] for field in ("doi", "url", "authors", "journal", "title")})
                match["note"] = note
            continue
        kept.append(item)
    kept.sort(key=lambda item: (-item["year"], item["title"].lower()))
    return kept


if __name__ == "__main__":
    main()
