import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ingest import ingest_file_bytes
from app.main import collection_stats, collection_reset


def test_reset_clears_collection(monkeypatch):
    # Use in-memory fallback
    monkeypatch.delenv("CHROMA_HOST", raising=False)

    # Ingest something
    ingest_file_bytes("reset.txt", b"ACME cash flow improved.")

    # Stats before
    before = collection_stats()
    assert before.get("count", 0) >= 1

    # Reset
    res = collection_reset()
    assert res["after"] == 0

    # Stats after
    after = collection_stats()
    assert after.get("count", 0) == 0
