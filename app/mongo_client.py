"""
MongoDB client for conversation storage
"""
import os
from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.database import Database
from pymongo.collection import Collection

_mongo_client = None
_mongo_db = None


def get_mongo_client() -> MongoClient:
    """Get or create MongoDB client"""
    global _mongo_client
    if _mongo_client is None:
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://finagent:finagent@localhost:27017/finagent_conversations?authSource=admin")
        _mongo_client = MongoClient(mongodb_url)
    return _mongo_client


def get_mongo_db() -> Database:
    """Get MongoDB database"""
    global _mongo_db
    if _mongo_db is None:
        client = get_mongo_client()
        # Extract database name from URL or use default
        db_name = os.getenv("MONGO_DB_NAME", "finagent_conversations")
        _mongo_db = client[db_name]
        # Create indexes on first access
        init_mongo_indexes(_mongo_db)
    return _mongo_db


def init_mongo_indexes(db: Database):
    """Initialize MongoDB indexes for efficient querying"""
    conversations: Collection = db["conversations"]
    messages: Collection = db["messages"]
    
    # Conversations indexes
    conversations.create_index([("user_id", ASCENDING), ("created_at", DESCENDING)])
    conversations.create_index([("session_id", ASCENDING)], unique=True)
    conversations.create_index([("user_id", ASCENDING), ("is_active", DESCENDING)])
    
    # Messages indexes
    messages.create_index([("session_id", ASCENDING), ("timestamp", ASCENDING)])
    messages.create_index([("session_id", ASCENDING), ("message_index", ASCENDING)])


def get_conversations_collection() -> Collection:
    """Get conversations collection"""
    return get_mongo_db()["conversations"]


def get_messages_collection() -> Collection:
    """Get messages collection"""
    return get_mongo_db()["messages"]


def close_mongo_client():
    """Close MongoDB connection"""
    global _mongo_client, _mongo_db
    if _mongo_client:
        _mongo_client.close()
        _mongo_client = None
        _mongo_db = None
