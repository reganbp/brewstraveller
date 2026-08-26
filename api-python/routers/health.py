from fastapi import APIRouter
from datetime import datetime

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def get_health():
    return {
        "status": "ok",
        "runtime": "Python (FastAPI)",
        "server_time": datetime.utcnow().isoformat() + "Z"
    }
