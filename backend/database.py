import sqlite3
import os
from datetime import datetime
from config import chat_client, CHAT_DEPLOYMENT

DB_PATH = "./data/conversations.db"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    os.makedirs("./data", exist_ok=True)
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES conversations(id)
        )
    """)
    conn.commit()
    conn.close()


def create_conversation(title: str) -> dict:
    conn = get_conn()
    cursor = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    cursor.execute(
        "INSERT INTO conversations (title, created_at) VALUES (?, ?)",
        (title, created_at)
    )
    conn.commit()
    conversation_id = cursor.lastrowid
    conn.close()
    return {"id": conversation_id, "title": title, "created_at": created_at}


def get_conversations() -> list:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, created_at FROM conversations ORDER BY created_at DESC"
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def get_messages(conversation_id: int) -> list:
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
        (conversation_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def save_message(conversation_id: int, role: str, content: str):
    conn = get_conn()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO messages (conversation_id, role, content, created_at) VALUES (?, ?, ?, ?)",
        (conversation_id, role, content, datetime.utcnow().isoformat())
    )
    conn.commit()
    conn.close()


def generate_title(question: str) -> str:
    try:
        response = chat_client.chat.completions.create(
            model=CHAT_DEPLOYMENT,
            messages=[
                {
                    "role": "system",
                    "content": "Generate a short 4-5 word title for a conversation that starts with this question. Return only the title, no punctuation, no quotes.",
                },
                {"role": "user", "content": question},
            ],
            max_tokens=20,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        return question[:40]