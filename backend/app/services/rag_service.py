from pathlib import Path
from typing import List, Tuple
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import FAISS
from app.core.config import settings

def chunk_text(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""]
    )
    return splitter.split_text(text)

def create_faiss_index(text: str, document_id: int) -> Tuple[str, int]:
    chunks = chunk_text(text)
    embeddings = OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        openai_api_key=settings.OPENAI_API_KEY
    )
    vectorstore = FAISS.from_texts(chunks, embeddings)
    faiss_dir = Path(settings.FAISS_DIR)
    faiss_dir.mkdir(parents=True, exist_ok=True)
    index_path = str(faiss_dir / f"doc_{document_id}")
    vectorstore.save_local(index_path)
    return index_path, len(chunks)

def search_similar_chunks(query: str, index_path: str, k: int = 5) -> List[str]:
    embeddings = OpenAIEmbeddings(
        model=settings.EMBEDDING_MODEL,
        openai_api_key=settings.OPENAI_API_KEY
    )
    vectorstore = FAISS.load_local(
        index_path, embeddings,
        allow_dangerous_deserialization=True
    )
    docs = vectorstore.similarity_search(query, k=k)
    return [doc.page_content for doc in docs]
