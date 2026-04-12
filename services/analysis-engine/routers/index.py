from fastapi import APIRouter
from models.schemas import IndexRepoRequest
from indexer.repo_scanner import RepoScanner
from indexer.vector_store import VectorStore

router = APIRouter()
scanner = RepoScanner()
store = VectorStore()

@router.post("/")
async def index_repo(request: IndexRepoRequest):
    chunks = scanner.process_files(request.repo_id, request.files)
    if not chunks:
        return {"status": "skipped", "message": "No indexable files found"}
        
    num_indexed = store.build_index(request.repo_id, chunks)
    return {"status": "indexed", "chunks_indexed": num_indexed}
