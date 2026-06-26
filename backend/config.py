import os
from dotenv import load_dotenv
from openai import AzureOpenAI

load_dotenv()

def _require(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise ValueError(f"Missing required environment variable: {name}")
    return value

AZURE_ENDPOINT = _require("AZURE_OPENAI_ENDPOINT")
AZURE_API_KEY = _require("AZURE_OPENAI_API_KEY")
CHAT_DEPLOYMENT = _require("AZURE_OPENAI_CHAT_DEPLOYMENT")
EMBEDDING_DEPLOYMENT = _require("AZURE_OPENAI_EMBEDDING_DEPLOYMENT")
AZURE_API_VERSION = _require("AZURE_OPENAI_API_VERSION")

chat_client = AzureOpenAI(
    azure_endpoint=AZURE_ENDPOINT,
    api_key=AZURE_API_KEY,
    api_version=AZURE_API_VERSION,
)

embedding_client = AzureOpenAI(
    azure_endpoint=AZURE_ENDPOINT,
    api_key=AZURE_API_KEY,
    api_version=AZURE_API_VERSION,
)