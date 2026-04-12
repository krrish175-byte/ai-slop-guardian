from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def health():
    return {"status": "ok", "version": "1.0.0"}
