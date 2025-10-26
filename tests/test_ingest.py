import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.ingest import simple_chunk, ingest_file_bytes


def test_simple_chunk_basic():
    text = "abcdefghi" * 50
    chunks = simple_chunk(text, chunk_size=100, overlap=10)
    assert len(chunks) > 0
    assert all(isinstance(c, str) and len(c) > 0 for c in chunks)


def test_ingest_bytes_txt(monkeypatch):
    # Ensure local in-memory fallback is used for tests (no remote Chroma)
    monkeypatch.delenv("CHROMA_HOST", raising=False)
    res = ingest_file_bytes("test.txt", b"hello world\nthis is a test document")
    assert res["filename"] == "test.txt"
    assert res["chunks"] >= 1
    assert isinstance(res["collection"], str)
