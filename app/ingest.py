import io
import os
from typing import List, Tuple

from .llm_provider import get_llm_and_embeddings
from .chroma_client import get_chroma_collection


def extract_text_from_pdf_bytes(data: bytes) -> str:
    """Try to extract text using PyMuPDF; fallback to pdfminer.six."""
    try:
        import fitz  # PyMuPDF
        text_parts: List[str] = []
        with fitz.open(stream=data, filetype="pdf") as doc:
            for page in doc:
                text_parts.append(page.get_text())
        return "\n".join(text_parts).strip()
    except Exception:
        # fallback to pdfminer
        try:
            from pdfminer.high_level import extract_text
            text = extract_text(io.BytesIO(data))
            return (text or "").strip()
        except Exception:
            return ""


def simple_chunk(text: str, chunk_size: int = 800, overlap: int = 100) -> List[str]:
    """Naive fixed-size chunker with overlap."""
    if not text:
        return []
    chunks = []
    start = 0
    n = len(text)
    while start < n:
        end = min(n, start + chunk_size)
        chunks.append(text[start:end])
        if end == n:
            break
        start = end - overlap
        if start < 0:
            start = 0
    return chunks


def embed_texts(texts: List[str]) -> List[List[float]]:
    _, embedder = get_llm_and_embeddings()
    vectors = embedder(texts)
    return vectors


def upsert_chunks(chunks: List[str], metadata: dict) -> Tuple[int, str]:
    collection = get_chroma_collection()
    ids = [f"doc_{metadata.get('source','upload')}_{i}" for i in range(len(chunks))]
    vectors = embed_texts(chunks)
    collection.upsert(ids=ids, documents=chunks, metadatas=[metadata] * len(chunks), embeddings=vectors)
    return len(chunks), collection.name


def ingest_file_bytes(filename: str, content: bytes) -> dict:
    name_lower = filename.lower()
    if name_lower.endswith(".pdf"):
        text = extract_text_from_pdf_bytes(content)
    elif name_lower.endswith(".txt"):
        text = content.decode("utf-8", errors="ignore")
    elif name_lower.endswith((".csv", ".tsv")):
        # simple CSV/TSV to text rows
        try:
            decoded = content.decode("utf-8", errors="ignore")
            text = decoded
        except Exception:
            text = ""
    else:
        text = content.decode("utf-8", errors="ignore")

    chunks = simple_chunk(text)
    count, coll = (0, "") if not chunks else upsert_chunks(chunks, metadata={"source": filename})
    return {"filename": filename, "chunks": count, "collection": coll}
