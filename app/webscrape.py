import re
import requests
from typing import List, Tuple

WIKI_SUMMARY = "https://en.wikipedia.org/api/rest_v1/page/summary/{}"


def _slugify(title: str) -> str:
    s = re.sub(r"[^\w\s-]", "", title).strip()
    s = re.sub(r"[\s-]+", "_", s)
    return s or "Finance"


def fetch_wikipedia_summary(query: str) -> Tuple[List[str], List[str]]:
    """Fetch a short summary from Wikipedia as a safe, no-auth web source.
    Returns (docs, sources).
    """
    topic = _slugify(query.split("?")[0])[:120]
    url = WIKI_SUMMARY.format(topic)
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            data = r.json()
            extract = data.get("extract") or ""
            page_url = data.get("content_urls",{}).get("desktop",{}).get("page", f"https://en.wikipedia.org/wiki/{topic}")
            if extract:
                return [extract], [page_url]
    except Exception:
        pass
    return [], []


def search_and_fetch(query: str, max_docs: int = 2) -> Tuple[List[str], List[str]]:
    """Attempts to fetch a couple of public web summaries related to the query.
    Currently uses Wikipedia summary as a safe fallback. Returns (docs, sources)."""
    docs, srcs = fetch_wikipedia_summary(query)
    return docs[:max_docs], srcs[:max_docs]
