import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ingest import ingest_file_bytes
from app.main import collection_stats


def test_collection_stats_increments(monkeypatch):
    # Use in-memory fallback
    monkeypatch.delenv("CHROMA_HOST", raising=False)

    # initial stats
    before = collection_stats()
    before_count = before.get("count", 0)

    # ingest
    ingest_file_bytes("stats.txt", b"Revenue increased 5%.")

    # after stats
    after = collection_stats()
    assert after.get("count", 0) >= before_count + 1
