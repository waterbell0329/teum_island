import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from app.core.config import settings
from app.routers import emotion_logs, users, quests

logger = logging.getLogger("teum_island")

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


# 2026-09-15 실기기 스크린샷 점검 중 발견: 처리 안 된 예외(500)가 나면 프론트에서
# 실제 에러 내용 대신 "CORS policy" 에러로만 보임 (pet_name 컬럼 없어서 500 나던 케이스에서
# 재현됨). 처음엔 @app.exception_handler(Exception)으로 잡아봤는데도 안 고쳐졌는데,
# 원인 확인해보니 FastAPI가 Exception/500 핸들러는 일부러 ServerErrorMiddleware로 보내고
# 그 미들웨어는 CORSMiddleware 바깥에서 응답을 만들어버려서 CORS 헤더가 원천적으로 못 붙는
# 구조였음 (FastAPI 내부 build_middleware_stack 코드에서 확인). 그래서 bare Exception 대신
# 실제로 터지는 예외 클래스(APIError, Supabase/PostgREST 호출 실패)를 구체적으로 잡음 --
# 이건 ExceptionMiddleware(=CORSMiddleware 안쪽)가 처리해서 헤더가 정상적으로 붙는다.
@app.exception_handler(APIError)
async def supabase_api_error_handler(request: Request, exc: APIError):
    logger.exception("Supabase/PostgREST 에러 on %s %s: %s", request.method, request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "얼룩이가 잠깐 딴 데를 봤나봐, 다시 한 번 눌러줄래?"},
    )


@app.get("/")
def health_check():
    return {"status": "ok"}
