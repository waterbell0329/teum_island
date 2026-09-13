from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import emotion_logs, users, quests

app = FastAPI(title="정화섬 API", version="0.1.0")

# 프론트(Next.js, 보통 localhost:3000)에서 호출 가능하게.
# 배포 도메인이 정해지면 .env의 ALLOWED_ORIGINS에 콤마로 추가하면 됨 (코드 수정 불필요).
# Vercel로 배포할 경우 프리뷰 배포마다 도메인이 바뀌므로 정규식으로 전부 허용.
_origins = [o.strip() for o in settings.allowed_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(emotion_logs.router, prefix="/emotion-logs", tags=["emotion-logs"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(quests.router, prefix="/quests", tags=["quests"])


@app.get("/")
def health_check():
    return {"status": "ok"}
