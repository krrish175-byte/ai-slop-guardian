from fastapi import APIRouter, Depends
from models.schemas import IndexRepoRequest
from indexer.repo_scanner import RepoScanner
from indexer.vector_store import VectorStore
from utils.limiter import limiter
from utils.security import verify_api_key

router = APIRouter()
scanner = RepoScanner()
store = VectorStore()


@router.post("/", dependencies=[Depends(verify_api_key)])
@limiter.limit("2/minute")
async def index_repo(request: IndexRepoRequest):

    chunks = scanner.process_files(request.repo_id, request.files)
    if not chunks:
        return {"status": "skipped", "message": "No indexable files found"}

    num_indexed = store.build_index(request.repo_id, chunks)
    return {"status": "indexed", "chunks_indexed": num_indexed}
