import os
from typing import Dict, Any, List, Optional

from .llm_provider import get_llm_and_embeddings
from .retrieval import retrieve_context
from .webscrape import search_and_fetch


def build_chat_prompt(
    question: str, 
    rag_docs: list[str], 
    web_docs: list[str], 
    conversation_history: List[Dict[str, str]] = None,
    user_context: Optional[Dict[str, Any]] = None
) -> str:
    parts = [
        "You are FinAgent, an AI-powered financial advisor assistant.",
        "You provide personalized financial advice based on the user's actual financial data.",
        "Always be professional, helpful, and data-driven in your responses.",
    ]
    
    # Add user's personalized financial context
    if user_context:
        parts.append("\n=== User's Financial Profile ===")
        if user_context.get("name"):
            parts.append(f"User: {user_context['name']}")
        if user_context.get("total_balance") is not None:
            parts.append(f"Total Balance: ${user_context['total_balance']:.2f}")
        if user_context.get("monthly_income") is not None:
            parts.append(f"Monthly Income: ${user_context['monthly_income']:.2f}")
        if user_context.get("monthly_expenses") is not None:
            parts.append(f"Monthly Expenses: ${user_context['monthly_expenses']:.2f}")
        if user_context.get("accounts"):
            parts.append(f"Number of Accounts: {len(user_context['accounts'])}")
            parts.append("Accounts: " + ", ".join([f"{acc['name']} (${acc['balance']:.2f})" for acc in user_context['accounts'][:3]]))
        if user_context.get("top_spending_categories"):
            parts.append("Top Spending: " + ", ".join(user_context['top_spending_categories'][:3]))
        if user_context.get("financial_goals"):
            parts.append(f"Active Goals: {len(user_context['financial_goals'])}")
            for goal in user_context['financial_goals'][:2]:
                progress = (goal['current_amount'] / goal['target_amount'] * 100) if goal['target_amount'] > 0 else 0
                parts.append(f"  - {goal['name']}: ${goal['current_amount']:.0f}/${goal['target_amount']:.0f} ({progress:.0f}%)")
        parts.append("=" * 40)
    
    # Add conversation history for context
    if conversation_history and len(conversation_history) > 0:
        parts.append("\n=== Conversation History ===")
        for msg in conversation_history[-5:]:  # Last 5 messages for context
            role = "User" if msg["role"] == "user" else "FinAgent"
            parts.append(f"{role}: {msg['content'][:200]}")  # Limit length
        parts.append("=" * 40)
    
    if rag_docs:
        parts.append("\n=== RAG Context (Financial Knowledge Base) ===")
        parts.append("\n\n".join(rag_docs[:5]))
        parts.append("=" * 40)
    
    if web_docs:
        parts.append("\n=== Web Context (Latest Information) ===")
        parts.append("\n\n".join(web_docs[:3]))
        parts.append("=" * 40)
    
    parts.append(f"\nUser Question: {question}")
    parts.append("\nProvide a personalized, actionable answer based on the user's financial situation:")
    return "\n".join(parts)


essential_keys = ("answer", "sources", "used")


def chat_answer(question: str) -> Dict[str, Any]:
    """Original chat answer without conversation context (for backward compatibility)"""
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


def chat_answer_with_context(
    question: str, 
    conversation_history: List[Dict[str, str]] = None,
    user_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Enhanced chat answer with conversation history and user's financial context"""
    llm, _ = get_llm_and_embeddings()

    # Retrieve from vector DB
    rag_docs, rag_meta = retrieve_context(question, top_k=int(os.getenv("RETRIEVAL_K", "5")))

    # Light web fetch (Wikipedia fallback)
    web_docs, web_sources = search_and_fetch(question, max_docs=2)

    prompt = build_chat_prompt(question, rag_docs, web_docs, conversation_history, user_context)
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
            "personalized": bool(user_context),
        },
    }

