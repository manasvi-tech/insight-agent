import sqlite3
import json
from config import chat_client, CHAT_DEPLOYMENT
DB_PATH = "./data/orders.db"

SCHEMA = """
Table: orders
Columns: order_id (TEXT), customer (TEXT), product (TEXT),
         amount (REAL), status (TEXT), order_date (TEXT, format YYYY-MM-DD)
Valid status values: delivered, shipped, cancelled, processing, pending, returned
Current date: 30 June 2026
"""

def generate_sql(question: str) -> str:
    response = chat_client.chat.completions.create(
        model=CHAT_DEPLOYMENT,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a SQL expert. Given a question and a table schema, "
                    "write a single valid SQLite query that answers the question. "
                    "Return only the SQL query, nothing else. No markdown, no explanation. "
                    "Only use columns that exist in the schema. "
                    f"Schema: {SCHEMA}"
                ),
            },
            {"role": "user", "content": question},
        ],
    )
    return response.choices[0].message.content.strip()


def execute_sql(query: str) -> list[dict]:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(query)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def query_orders(question: str) -> dict:
    sql = generate_sql(question)
    try:
        results = execute_sql(sql)
        return {"sql": sql, "results": results}
    except sqlite3.Error as e:
        return {"sql": sql, "results": [], "error": str(e)}