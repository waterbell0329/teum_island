from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import emotion_logs, users, quests

app = FastAPI(title="정화섬 API", version="0.1.0")

# 프론트(Next.js, 보통 localhost:3000)에서 호출 가능하게
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # 배포시 실제 도메인 추가
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
