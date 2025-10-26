import os
from typing import Optional

# Persist in-memory collections across calls
_MEMORY_COLLECTIONS = {}

def get_chroma_collection(collection_name: Optional[str] = None):
    """Return a ChromaDB collection.

    If CHROMA_HOST is set, connect to the remote server; otherwise use an in-memory client
    suitable for tests and local dev.
    """
    collection_name = collection_name or os.getenv("CHROMA_COLLECTION", "documents")
    host = os.getenv("CHROMA_HOST")
    port = int(os.getenv("CHROMA_PORT", "8000"))

    try:
        if host:
            import chromadb  # type: ignore
            client = chromadb.HttpClient(host=host, port=port)
        else:
            import chromadb  # type: ignore
            from chromadb.config import Settings  # type: ignore
            client = chromadb.Client(Settings())

        return client.get_or_create_collection(name=collection_name)
    except ImportError:
        # Fallback: minimal in-memory collection compatible with .upsert and .name
        class _MemoryCollection:
            def __init__(self, name: str):
                self.name = name
                self._store = []

            def upsert(self, ids=None, documents=None, metadatas=None, embeddings=None):
                ids = ids or []
                documents = documents or []
                metadatas = metadatas or []
                embeddings = embeddings or []
                for i, d, m, e in zip(ids, documents, metadatas, embeddings):
                    self._store.append({"id": i, "doc": d, "meta": m, "emb": e})

            def query(self, query_embeddings=None, n_results: int = 5, include=None):
                # very simple cosine similarity search over stored vectors
                include = include or ["documents", "metadatas", "distances"]
                if not query_embeddings:
                    return {k: [[]] for k in include}
                import math

                def cosine(a, b):
                    dot = sum(x * y for x, y in zip(a, b))
                    na = math.sqrt(sum(x * x for x in a)) + 1e-9
                    nb = math.sqrt(sum(y * y for y in b)) + 1e-9
                    return dot / (na * nb)

                q = query_embeddings[0]
                scored = []
                for row in self._store:
                    emb = row.get("emb") or []
                    if len(emb) != len(q):
                        continue
                    scored.append((cosine(q, emb), row))
                scored.sort(key=lambda x: x[0], reverse=True)
                top = scored[:n_results]
                out = {"documents": [[]], "metadatas": [[]], "distances": [[]]}
                for score, row in top:
                    out["documents"][0].append(row["doc"]) if "documents" in include else None
                    out["metadatas"][0].append(row["meta"]) if "metadatas" in include else None
                    out["distances"][0].append(1 - score) if "distances" in include else None
                return out

            def count(self):
                return len(self._store)

        coll = _MEMORY_COLLECTIONS.get(collection_name)
        if coll is None:
            coll = _MemoryCollection(collection_name)
            _MEMORY_COLLECTIONS[collection_name] = coll
        return coll


def reset_chroma_collection(collection_name: Optional[str] = None) -> int:
    """Reset (delete and recreate) the given collection. Returns previous count.

    Works with both remote/local chromadb and the in-memory fallback.
    """
    collection_name = collection_name or os.getenv("CHROMA_COLLECTION", "documents")
    host = os.getenv("CHROMA_HOST")
    try:
        if host:
            import chromadb  # type: ignore
            client = chromadb.HttpClient(host=host, port=int(os.getenv("CHROMA_PORT", "8000")))
        else:
            import chromadb  # type: ignore
            from chromadb.config import Settings  # type: ignore
            client = chromadb.Client(Settings())
        # get current count then delete and recreate
        try:
            existing = client.get_or_create_collection(name=collection_name)
            before = existing.count()
        except Exception:
            before = 0
        try:
            client.delete_collection(name=collection_name)  # type: ignore
        except Exception:
            pass
        client.get_or_create_collection(name=collection_name)
        return int(before)
    except ImportError:
        # in-memory fallback
        coll = get_chroma_collection(collection_name)
        before = len(getattr(coll, "_store", []))
        if hasattr(coll, "_store"):
            coll._store.clear()  # type: ignore[attr-defined]
        return int(before)
