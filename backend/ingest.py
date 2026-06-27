import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"
import sqlite3
import csv
from pathlib import Path
import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from pypdf import PdfReader
from config import EMBEDDING_DEPLOYMENT, AZURE_ENDPOINT, AZURE_API_KEY, AZURE_API_VERSION

DOCUMENTS_PATH = "./data/documents"
ORDERS_CSV_PATH = "./data/orders.csv"
DB_PATH = "./data/orders.db"
CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "documents"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50


embedding_fn = OpenAIEmbeddingFunction(
    api_key=AZURE_API_KEY,
    api_base=AZURE_ENDPOINT,
    api_type="azure",
    api_version=AZURE_API_VERSION,
    model_name=EMBEDDING_DEPLOYMENT,
    deployment_id=EMBEDDING_DEPLOYMENT,
)


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    chunks = []
    start = 0
    while start < len(words):
        end = start + size
        chunks.append(" ".join(words[start:end]))
        start += size - overlap
    return chunks


def ingest_documents():
    chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
    try:
        chroma_client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass
    collection = chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        embedding_function=embedding_fn,
        metadata={"hnsw:space": "cosine"},
    )

    for pdf_file in Path(DOCUMENTS_PATH).glob("*.pdf"):
        print(f"Processing {pdf_file.name}...")
        reader = PdfReader(str(pdf_file))
        for page_num, page in enumerate(reader.pages, start=1):
            text = page.extract_text()
            if not text:
                continue
            chunks = chunk_text(text)
            for i, chunk in enumerate(chunks):
                chunk_id = f"{pdf_file.name}_page{page_num}_chunk{i}"
                collection.add(
                    documents=[chunk],
                    metadatas=[{"source": pdf_file.name, "page": page_num}],
                    ids=[chunk_id],
                )

    print(f"Documents ingested successfully.")


def ingest_orders():
    print("Ingesting orders CSV into SQLite...")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer TEXT,
            product TEXT,
            amount REAL,
            status TEXT,
            order_date TEXT
        )
    """)

    with open(ORDERS_CSV_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cursor.execute("""
                INSERT OR REPLACE INTO orders
                (order_id, customer, product, amount, status, order_date)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                row["order_id"],
                row["customer"],
                row["product"],
                float(row["amount"]),
                row["status"],
                row["order_date"],
            ))

    conn.commit()
    conn.close()
    print("Orders ingested successfully.")


if __name__ == "__main__":
    ingest_documents()
    ingest_orders()
    print("All ingestion complete.")