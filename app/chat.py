import os
from typing import Dict, Any

from .llm_provider import get_llm_and_embeddings
from .retrieval import retrieve_context
from .webscrape import search_and_fetch


def build_chat_prompt(question: str, rag_docs: list[str], web_docs: list[str]) -> str:
    parts = [
        "You are an enterprise-grade financial assistant.",
        "Synthesize a concise, decision-oriented answer.",
        "Cite data-driven points when possible.",
        "If something is uncertain, state assumptions succinctly.",
    ]
    if rag_docs:
        parts.append("\nRAG Context:\n" + "\n\n".join(rag_docs[:5]))
    if web_docs:
        parts.append("\nWeb Context:\n" + "\n\n".join(web_docs[:3]))
    parts.append(f"\nUser question: {question}\n\nAnswer:")
    return "\n".join(parts)


essential_keys = ("answer", "sources", "used")


def chat_answer(question: str) -> Dict[str, Any]:
    llm, _ = get_llm_and_embeddings()

    # Retrieve from vector DB
    rag_docs, rag_meta = retrieve_context(question, top_k=int(os.getenv("RETRIEVAL_K", "5")))

    # Light web fetch (Wikipedia fallback)
    web_docs, web_sources = search_and_fetch(question, max_docs=2)

    prompt = build_chat_prompt(question, rag_docs, web_docs)
    answer_text = llm(prompt)

    return {
        "answer": answer_text,
        "sources": {
            "rag": rag_meta,
            "web": web_sources,
        },
        "used": {
            "rag": bool(rag_docs),
            "web": bool(web_docs),
            "model": os.getenv("LLM_PROVIDER", "local"),
        },
    }
