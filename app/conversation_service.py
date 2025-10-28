"""
Conversation service for managing chat sessions and messages
"""
import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from pymongo.collection import Collection

from .mongo_client import get_conversations_collection, get_messages_collection
from .conversation_models import (
    ConversationSession, Message, ConversationResponse, 
    ConversationWithMessages
)


def get_financial_context_for_chat(user_id: str) -> Optional[str]:
    """
    Get financial summary context for chat conversations
    
    Args:
        user_id: The user's ID
        
    Returns:
        Formatted financial context string or None
    """
    try:
        from .financial_db import SessionLocal
        from .financial_service import get_financial_summary
        
        db = SessionLocal()
        try:
            summary = get_financial_summary(db, user_id)
            
            # Format financial context for LLM
            context_parts = [
                f"\n=== USER'S FINANCIAL CONTEXT ===",
                f"Net Worth: ${summary.net_worth:,.2f}",
                f"Total Assets: ${summary.total_assets:,.2f}",
                f"Total Liabilities: ${summary.total_liabilities:,.2f}",
                f"Monthly Income: ${summary.total_income_this_month:,.2f}",
                f"Monthly Expenses: ${summary.total_expenses_this_month:,.2f}",
                f"Monthly Cash Flow: ${summary.monthly_cash_flow:,.2f}",
            ]
            
            if summary.total_debt > 0:
                context_parts.append(f"Total Debt: ${summary.total_debt:,.2f}")
                context_parts.append(f"Debt-to-Income Ratio: {summary.debt_to_income_ratio:.1f}%")
            
            if summary.total_investments_value > 0:
                context_parts.append(f"Total Investments: ${summary.total_investments_value:,.2f}")
            
            if summary.active_goals_count > 0:
                context_parts.append(f"Active Financial Goals: {summary.active_goals_count}")
            
            if summary.top_spending_category:
                context_parts.append(f"Top Spending Category: {summary.top_spending_category} (${summary.top_spending_amount:,.2f})")
            
            if summary.budget_adherence_percentage > 0:
                context_parts.append(f"Budget Adherence: {summary.budget_adherence_percentage:.1f}%")
            
            context_parts.append("=== END FINANCIAL CONTEXT ===\n")
            
            return "\n".join(context_parts)
        finally:
            db.close()
    except Exception as e:
        # If financial data not available, return None
        print(f"Could not fetch financial context: {e}")
        return None


def create_conversation_session(user_id: str, title: str = "New Conversation") -> ConversationSession:
    """
    Create a new conversation session for a user
    
    Args:
        user_id: The user's ID
        title: Optional title for the conversation
        
    Returns:
        ConversationSession object
    """
    session_id = str(uuid.uuid4())
    now = datetime.utcnow()
    
    session = ConversationSession(
        session_id=session_id,
        user_id=user_id,
        title=title,
        created_at=now,
        updated_at=now,
        message_count=0,
        is_active=True
    )
    
    conversations: Collection = get_conversations_collection()
    conversations.insert_one(session.dict())
    
    return session


def get_conversation_session(session_id: str) -> Optional[ConversationSession]:
    """
    Get a conversation session by ID
    
    Args:
        session_id: The session ID
        
    Returns:
        ConversationSession or None if not found
    """
    conversations: Collection = get_conversations_collection()
    doc = conversations.find_one({"session_id": session_id})
    
    if doc:
        doc.pop("_id", None)  # Remove MongoDB's internal ID
        return ConversationSession(**doc)
    return None


def get_user_conversations(user_id: str, limit: int = 50, active_only: bool = False) -> List[ConversationResponse]:
    """
    Get all conversation sessions for a user
    
    Args:
        user_id: The user's ID
        limit: Maximum number of conversations to return
        active_only: If True, only return active conversations
        
    Returns:
        List of ConversationResponse objects
    """
    conversations: Collection = get_conversations_collection()
    
    query = {"user_id": user_id}
    if active_only:
        query["is_active"] = True
    
    docs = conversations.find(query).sort("updated_at", -1).limit(limit)
    
    result = []
    for doc in docs:
        doc.pop("_id", None)
        result.append(ConversationResponse(**doc))
    
    return result


def save_message(session_id: str, role: str, content: str) -> Message:
    """
    Save a message to a conversation session
    
    Args:
        session_id: The session ID
        role: 'user' or 'assistant'
        content: Message content
        
    Returns:
        Message object
    """
    conversations: Collection = get_conversations_collection()
    messages: Collection = get_messages_collection()
    
    # Get current message count to determine index
    session = conversations.find_one({"session_id": session_id})
    if not session:
        raise ValueError(f"Session {session_id} not found")
    
    message_index = session.get("message_count", 0)
    
    # Create message
    message = Message(
        role=role,
        content=content,
        timestamp=datetime.utcnow(),
        message_index=message_index
    )
    
    # Store in MongoDB
    message_doc = message.dict()
    message_doc["session_id"] = session_id
    messages.insert_one(message_doc)
    
    # Update conversation metadata
    conversations.update_one(
        {"session_id": session_id},
        {
            "$set": {"updated_at": datetime.utcnow()},
            "$inc": {"message_count": 1}
        }
    )
    
    # Update title based on first user message
    if role == "user" and message_index == 0:
        # Use first 50 chars of first message as title
        title = content[:50] + ("..." if len(content) > 50 else "")
        conversations.update_one(
            {"session_id": session_id},
            {"$set": {"title": title}}
        )
    
    return message


def get_conversation_messages(session_id: str, limit: Optional[int] = None) -> List[Message]:
    """
    Get all messages for a conversation session
    
    Args:
        session_id: The session ID
        limit: Optional limit on number of messages
        
    Returns:
        List of Message objects in chronological order
    """
    messages: Collection = get_messages_collection()
    
    query = {"session_id": session_id}
    cursor = messages.find(query).sort("message_index", 1)
    
    if limit:
        cursor = cursor.limit(limit)
    
    result = []
    for doc in cursor:
        doc.pop("_id", None)
        doc.pop("session_id", None)
        result.append(Message(**doc))
    
    return result


def get_conversation_with_messages(session_id: str) -> Optional[ConversationWithMessages]:
    """
    Get a conversation session with all its messages
    
    Args:
        session_id: The session ID
        
    Returns:
        ConversationWithMessages object or None if not found
    """
    session = get_conversation_session(session_id)
    if not session:
        return None
    
    messages = get_conversation_messages(session_id)
    
    return ConversationWithMessages(
        session=ConversationResponse(**session.dict()),
        messages=messages
    )


def build_conversation_context(session_id: str, max_messages: int = 10, user_id: Optional[str] = None) -> List[Dict[str, str]]:
    """
    Build conversation context for LLM from recent messages
    
    Args:
        session_id: The session ID
        max_messages: Maximum number of recent messages to include
        user_id: Optional user ID to include financial context
        
    Returns:
        List of message dictionaries with 'role' and 'content'
    """
    messages = get_conversation_messages(session_id)
    
    # Get the most recent messages
    recent_messages = messages[-max_messages:] if len(messages) > max_messages else messages
    
    # Convert to LLM format
    context = []
    
    # Add financial context as first system message if user_id provided
    if user_id:
        financial_context = get_financial_context_for_chat(user_id)
        if financial_context:
            context.append({
                "role": "system",
                "content": financial_context
            })
    
    # Add conversation messages
    for msg in recent_messages:
        context.append({
            "role": msg.role,
            "content": msg.content
        })
    
    return context


def delete_conversation(session_id: str) -> bool:
    """
    Delete a conversation session and all its messages
    
    Args:
        session_id: The session ID
        
    Returns:
        True if deleted, False if not found
    """
    conversations: Collection = get_conversations_collection()
    messages: Collection = get_messages_collection()
    
    # Delete all messages
    messages.delete_many({"session_id": session_id})
    
    # Delete conversation
    result = conversations.delete_one({"session_id": session_id})
    
    return result.deleted_count > 0


def archive_conversation(session_id: str) -> bool:
    """
    Archive a conversation (set is_active to False)
    
    Args:
        session_id: The session ID
        
    Returns:
        True if archived, False if not found
    """
    conversations: Collection = get_conversations_collection()
    
    result = conversations.update_one(
        {"session_id": session_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow()}}
    )
    
    return result.modified_count > 0


def get_or_create_active_session(user_id: str) -> ConversationSession:
    """
    Get the user's most recent active session, or create a new one
    
    Args:
        user_id: The user's ID
        
    Returns:
        ConversationSession object
    """
    conversations: Collection = get_conversations_collection()
    
    # Find most recent active session
    doc = conversations.find_one(
        {"user_id": user_id, "is_active": True},
        sort=[("updated_at", -1)]
    )
    
    if doc:
        doc.pop("_id", None)
        return ConversationSession(**doc)
    
    # No active session found, create new one
    return create_conversation_session(user_id)
