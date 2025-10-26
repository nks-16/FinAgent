import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ingest import ingest_file_bytes
from app.retrieval import retrieve_context


def test_retrieval_after_ingest(monkeypatch):
    # ensure we use local in-memory chroma fallback for this test
    monkeypatch.delenv("CHROMA_HOST", raising=False)

    # ingest a small text
    doc_text = b"Apple revenue grew 10% year-over-year."
    res = ingest_file_bytes("report.txt", doc_text)
    assert res["chunks"] >= 1

    # retrieve with a related query
    docs, metas = retrieve_context("What happened to Apple revenue?", top_k=3)
    assert isinstance(docs, list)
    assert len(docs) >= 1
