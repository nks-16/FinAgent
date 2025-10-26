import os
from typing import List, Tuple

from .chroma_client import get_chroma_collection
from .llm_provider import get_llm_and_embeddings


def retrieve_context(query: str, top_k: int = 5) -> Tuple[List[str], List[dict]]:
    """Embed the query and retrieve top_k documents from the configured collection."""
    _, embedder = get_llm_and_embeddings()
    qvec = embedder([query])[0]
    collection = get_chroma_collection()
    result = collection.query(query_embeddings=[qvec], n_results=top_k, include=["documents", "metadatas", "distances"])  # type: ignore
    docs = (result.get("documents") or [[]])[0]
    metas = (result.get("metadatas") or [[]])[0]
    return docs, metas


def build_rag_prompt(query: str, docs: List[str]) -> str:
    context = "\n\n".join(docs[:5])
    instructions = (
        "You are a financial analysis assistant. Use ONLY the provided context to answer the question.\n"
        "If the answer isn't in the context, say you don't have enough information. Be concise.\n"
    )
    return f"{instructions}\n\nContext:\n{context}\n\nQuestion: {query}\nAnswer:"
