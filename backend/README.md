# 백엔드 (FastAPI)

## 폴더 구조
```
app/
  main.py              # 앱 진입점, 라우터 등록
  core/config.py       # 환경변수 관리
  schemas/             # pydantic 요청/응답 모델
  routers/             # API 엔드포인트 (emotion_logs, users, quests)
  services/            # 4단계 AI 파이프라인 로직
    classifier_service.py   # 1단계: 감정 분류
    analysis_service.py     # 2단계: 구조화된 분석
    letter_service.py       # 3단계: 편지 생성
    xp_service.py           # 4단계: XP/레벨 계산
    safety_service.py       # 위기신호 감지 (안전장치)
```

## 로컬 실행 방법

1. 가상환경 만들기
```
python -m venv venv
source venv/bin/activate   # 윈도우는 venv\Scripts\activate
```

2. 패키지 설치
```
pip install -r requirements.txt
```

3. `.env` 파일 만들기 (`.env.example` 복사해서 실제 값 채우기)
```
cp .env.example .env
```

4. 감정분류기 모델 파일 넣기
- Colab에서 학습한 `emotion_baseline_model.joblib`을 `backend/models/` 폴더 만들어서 넣기

5. 서버 실행
```
uvicorn app.main:app --reload
```

6. 확인: 브라우저에서 `http://localhost:8000/docs` 열면 자동 생성된 API 문서(Swagger UI) 보임 — 여기서 바로 테스트 가능

## 아직 TODO로 남은 것 (스텁 상태)
- Supabase 실제 연동 (지금은 라우터에 주석으로만 표시됨)
- 자유텍스트 입력 시 감정강도 추론 (지금은 기본값 2로 고정)
- 베이스라인 5개 그룹 -> 12개 세부감정 매핑 (또는 LoRA 학습 완료되면 교체)
- 편지 생성 시 금지표현 걸리면 재생성하는 로직
