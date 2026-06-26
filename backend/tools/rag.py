import os
os.environ["ANONYMIZED_TELEMETRY"] = "False"

import chromadb
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from config import EMBEDDING_DEPLOYMENT, AZURE_ENDPOINT, AZURE_API_KEY, AZURE_API_VERSION

CHROMA_PATH = "./chroma_db"
COLLECTION_NAME = "documents"

embedding_fn = OpenAIEmbeddingFunction(
    api_key=AZURE_API_KEY,
    api_base=AZURE_ENDPOINT,
    api_type="azure",
    api_version=AZURE_API_VERSION,
    model_name=EMBEDDING_DEPLOYMENT,
)

chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma_client.get_or_create_collection(
    name=COLLECTION_NAME,
    embedding_function=embedding_fn,
    metadata={"hnsw:space": "cosine"},
)


def search_documents(query: str, n_results: int = 3) -> list[dict]:
    results = collection.query(
        query_texts=[query],
        n_results=n_results,
    )

    chunks = []
    for doc, meta in zip(results["documents"][0], results["metadatas"][0]):
        chunks.append({
            "text": doc,
            "source": meta.get("source", "unknown"),
            "page": meta.get("page", 1),
        })

    return chunks