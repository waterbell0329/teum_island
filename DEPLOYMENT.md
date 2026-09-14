# 배포 가이드

원티드 AI Championship 제출용으로 "라이브 서비스처럼" 링크 하나로 접속 가능하게 만드는 순서.
백엔드(Render) 먼저 배포 → 그 주소를 프론트(Vercel)에 넣고 배포 → 마지막에 프론트 최종 주소를
다시 백엔드 CORS 설정에 추가, 순서로 진행해야 함 (서로의 주소를 필요로 해서 한 번에 안 끝남).

---

## 0. 시작 전 확인

- GitHub에 최신 코드가 푸시되어 있어야 함 (Render/Vercel 둘 다 GitHub 저장소 연결 방식)
- `backend/.env`에 있는 실제 값들(SUPABASE_URL, SUPABASE_SERVICE_KEY, GOOGLE_API_KEY, GROQ_API_KEY)을
  미리 옆에 메모장 같은 데 복사해두면 편함 — Render 대시보드에 그대로 붙여넣을 것들이라

## 1. 백엔드 배포 (Render)

1. https://render.com 가입/로그인 (GitHub 계정으로 로그인하면 편함)
2. 대시보드에서 **New + → Blueprint**
3. 이 저장소(`teum_island`) 선택 → Render가 저장소 루트의 `render.yaml`을 자동으로 읽어서
   `teum-island-backend` 서비스를 구성해줌
4. 배포 전에 **환경변수(Environment) 입력 요청**이 뜨는 항목들 채우기 (`render.yaml`에
   `sync: false`로 표시해둔 것들 — Render가 값을 안 갖고 있어서 직접 입력해야 함):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `GOOGLE_API_KEY`
   - `GROQ_API_KEY`
   - `ANTHROPIC_API_KEY` (안 쓰면 빈 값으로 둬도 됨)
5. **Apply** 눌러서 배포 시작 → 몇 분 후 `https://teum-island-backend.onrender.com` 같은 주소가 생김
   (정확한 주소는 Render가 서비스 이름 기준으로 자동 생성, 대시보드에서 확인)
6. 배포 끝나면 `https://<그 주소>/docs`로 접속해서 Swagger 문서 뜨는지 확인 → 뜨면 정상 배포된 것
7. **이 백엔드 주소를 메모해두기** (2번 단계에서 프론트에 넣을 값)

⚠️ Render 무료 플랜은 트래픽 없으면 슬립 모드로 들어가서, 오랜만에 첫 요청 시 30초~1분 정도
깨어나는 데 걸릴 수 있음 — 발표 데모 직전엔 미리 한 번 접속해서 깨워두는 걸 추천.

## 2. 프론트엔드 배포 (Vercel)

1. https://vercel.com 가입/로그인 (GitHub 계정으로)
2. **Add New → Project** → 이 저장소 선택
3. **Root Directory**를 반드시 `frontend`로 지정 (모노레포라 기본값인 저장소 루트로 두면 빌드 실패함)
4. **Environment Variables**에 아래 3개 입력:
   - `NEXT_PUBLIC_API_URL` = 1번에서 메모해둔 백엔드 주소 (예: `https://teum-island-backend.onrender.com`)
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://vpmwqjrxhysifsmmdbci.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 지금 `frontend/.env.local`에 넣어둔 것과 동일한 값
5. **Deploy** 클릭 → 몇 분 후 `https://teum-island.vercel.app` 같은 주소 생성됨

## 3. 마무리 — 백엔드 CORS에 프론트 주소 등록

1. Render 대시보드 → `teum-island-backend` 서비스 → **Environment**
2. `ALLOWED_ORIGINS` 값을 아래처럼 콤마로 프론트 주소 추가:
   ```
   http://localhost:3000,https://teum-island.vercel.app
   ```
   (Vercel 프리뷰 배포 도메인은 `*.vercel.app` 정규식으로 코드에서 이미 자동 허용되고 있어서
   따로 안 넣어도 됨 — 이건 최종/커스텀 도메인만 챙기면 됨)
3. 저장하면 자동 재배포됨

## 4. 배포 후 꼭 확인할 것

- [ ] Supabase Auth → **URL Configuration**의 Redirect URL에 Vercel 최종 주소도 추가
      (`https://teum-island.vercel.app/auth/callback`) — 안 하면 배포된 사이트에서 구글 로그인 콜백이 안 됨
- [ ] `pet_name` 컬럼 마이그레이션 SQL 실행 여부 (별도 안내됨, 로컬/배포 상관없이 DB는 같은 Supabase 프로젝트라 한 번만 하면 됨)
- [ ] 배포된 주소로 신규 유저 가입 → 온보딩 → 기록 → 편지함/퀘스트까지 실제로 한 번 돌려보기
