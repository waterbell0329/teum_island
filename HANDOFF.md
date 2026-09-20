# 틈 아일랜드 (Teum Island) — 프로젝트 인수인계 문서

> 작성일: 2026-09-20. 원티드 AI 챔피언십 2026 제출용 (마감 9/20).
> 이 문서는 지금까지 Claude Code와 함께 작업한 내용을 다른 AI/개발자가 이어서
> 작업할 수 있도록 정리한 것. 코드에는 대부분 한국어 주석으로 "왜 이렇게 했는지"가
> 남아있으니, 특정 파일을 만지기 전에 그 파일 상단 주석부터 읽는 걸 권장.

## 1. 프로젝트가 뭔지

하루의 감정을 짧게 기록하면(감정 선택 또는 자유 텍스트), 섬에 사는 캐릭터(여우 펫)가
그걸 "먹고" 편지를 써서 돌려주는 힐링 다이어리 앱. 팀: 임수종(개발), 김채영(기획/아트).

핵심 컨셉:
- 캐릭터는 진화가 아니라 "옷 갈아입기"로 성장을 표현 (레벨업 = 새 옷).
- 요정 "얼룩이"가 유저와 캐릭터 사이를 중개 (편지를 듣고 전달해주는 역할).
- 거친 말/욕설은 필터링되고 편지에는 마음만 남음.
- **원티드 챔피언십 규정**: 심사위원이 회원가입 없이 핵심 기능을 체험할 수 있어야
  함 → Supabase 익명 로그인("로그인 없이 체험하기")으로 해결되어 있음.

## 2. 기술 스택

- 프론트: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 + Framer Motion
- 백엔드: Python FastAPI
- DB/Auth: Supabase (Postgres + Auth, 구글 로그인 + 익명 로그인)
- 배포: 프론트 Vercel, 백엔드 Render (`render.yaml` 참고, 이미 배포 성공한 이력 있음
  — `https://teum-island-backend.onrender.com`, `teum-island.vercel.app`)
- LLM: 자유 텍스트 편지 생성은 Groq(`openai/gpt-oss-120b`)로 실시간 분류+작성.
  구조화 입력은 미리 만들어둔 편지 풀에서 매칭(LLM 호출 없음). Gemini는 무료 쿼터
  문제로 보류 중, Anthropic 키는 코드에 배선만 돼있고 실사용은 안 함.

## 3. 로컬 실행법

```
# 백엔드
cd backend && ./venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
# 프론트
cd frontend && npm run dev
```
`frontend/.env.local`에 `NEXT_PUBLIC_API_URL=http://localhost:8000` 이미 설정됨.
백엔드는 `backend/.env`에 SUPABASE_URL/SUPABASE_SERVICE_KEY/GROQ_API_KEY 등 필요
(이미 로컬에 설정돼 있을 것, 없으면 Render 대시보드에서 값 확인 가능).

**Windows/git-bash 주의사항**: `lsof` 없음 → `netstat -ano | grep LISTENING`로 PID
찾아서 `taskkill //F //PID <pid>`. 포트 안 죽이고 재시작하면 "address already in
use"로 새 프로세스가 조용히 실패하니 주의.

## 4. 디렉토리 구조 (중요한 것만)

```
frontend/
  app/
    page.tsx              # 홈 화면
    login/page.tsx
    onboarding/page.tsx    # 닉네임 -> 인트로 -> 먹이주기튜토리얼 -> 펫이름 -> 완료
    input/page.tsx         # 감정 기록 입력 (EmotionCaptureFlow 사용)
    letters/page.tsx       # 편지함 (카드형 + 날짜그룹)
    quests/page.tsx        # 퀘스트
    closet/                # 옷장 (기존 28종 옷 시스템, 이번 세션에서 안 건드림)
    auth/callback/         # 구글 OAuth 콜백
  components/
    Character.tsx          # ⭐ 펫 캐릭터 렌더링 핵심 컴포넌트 (아래 5번에 상세)
    Fairy.tsx               # 요정 "얼룩이" (통짜 이미지, /assets/fairy/body.png)
    LevelUpScreen.tsx       # 레벨업 풀스크린 리빌 연출
    HomeHeader.tsx / WeeklySummaryCard.tsx / FoodPreview.tsx  # 홈 화면 위젯들
    QuestCompleteFx.tsx     # 퀘스트 완료 체크마크+XP+컨페티 연출
    SettingsModal.tsx       # 설정(배지/안전안내/로그아웃)
    IslandBackground.tsx / LoadingScreen.tsx / PageTransition.tsx
    BottomNav.tsx
  lib/
    growthStage.ts          # ⭐ 레벨 -> 성장단계(1/2/3) -> 옷 오버레이 경로 매핑
    outfits.ts               # 기존 28종 옷 시스템 (옷장 화면 전용, Character.tsx 옷 시스템과 별개)
    badges.ts / emotionColors.ts / pendingLevelUp.ts
    api.ts                   # 백엔드 fetch 래퍼
  public/assets/
    character/               # idle.png listening.png eating.png celebrating.png (+옷 stage1~3, 아직 없음)
    fairy/body.png
    background/island.png splash.png
backend/
  app/
    routers/{emotion_logs,users,quests}.py
    services/{letter_service,xp_service,quest_service,db_service,safety_service}.py
```

## 5. ⭐ 캐릭터 시스템 (`Character.tsx`) — 제일 중요, 최근에 크게 바뀜

**히스토리**: 부위별 합성(몸통+눈+입+팔다리 따로) → 위치 어긋남 버그 반복 →
사진 한 장 방식 → "상태별 통짜 이미지 4장 크로스페이드" 방식으로 최종 정착 (2026-09-19~20).

**현재 구조**:
```ts
const STATE_ASSET = {
  idle: "/assets/character/idle.png",
  listening: "/assets/character/listening.png",
  eating: "/assets/character/eating.png",
  celebrating: "/assets/character/celebrating.png",
};
const NATIVE = { w: 179, h: 158 };       // 4장의 공통 캔버스 크기
const MOUTH_Y_FRACTION = 0.58;            // 먹이가 도착하는 입 위치(세로 비율)
```
- `animationState` prop이 바뀌면 `AnimatePresence` + `motion.img`로 opacity
  크로스페이드 (0.35s). 4장 다 같은 캔버스 크기/캐릭터 위치로 정렬돼있어야 부드러움.
- 몸통 전체에 상시 숨쉬기 모션(작은 y+scale 반복)을 추가해서 정지 상태로 안 보이게 함.
- 옷은 `getStageOutfitAsset(getGrowthStage(level))`로 별도 `<img>` 오버레이를 몸통과
  **완전히 같은 박스(위치/크기)**에 겹쳐 그림 — 좌표 보정 로직 없음, 그냥 같은 box.
  파일 없으면(`stage1/2/3.png` 아직 안 받음) `onError`로 조용히 숨김 (깨진 아이콘 방지).
- `objectFit: "contain"` 안전장치 있음 — 실제 이미지 비율이 NATIVE랑 조금 달라도
  찌그러지지 않고 레터박스 처리됨.

**⚠️ 지금 자산 상태 (임시방편, 다음 AI가 개선할 여지 큼)**:
- `idle.png` / `listening.png` = **완전히 같은 파일** (옷 입은 "무표정" 포즈를
  재사용함, 원본 시트에 listening 전용 옷 입은 포즈가 없었음).
- `eating.png` = 옷을 안 입은 맨몸 포즈 (원본 시트에 "옷 입고 입 벌린" 포즈가
  없어서, 입 벌린 표정을 살리려고 맨몸 버전을 그대로 씀). **여기가 제일 눈에
  띄는 미봉책** — eating 상태로 넘어갈 때만 옷이 사라졌다가 돌아오는 것처럼 보임.
- `celebrating.png` = 옷 입은 버전인데 크롭 과정에서 몸통 아랫부분(다리)이 잘려서
  얼굴+목걸이 부분만 보임 (opening 모폴로지 연산 도중 목 부분이 가늘어서 상체/하체가
  분리돼버림). 시간 부족으로 그대로 둠.
- `stage1.png` / `stage2.png` / `stage3.png` (레벨 구간별 옷 오버레이)는 **아직 없음**.
  `lib/growthStage.ts`에 경로만 정의돼있고 실제 파일은 없어서 `onError`로 항상
  숨겨짐 — 지금은 몸통 이미지 자체에 옷이 "베이크인"되어 있는 상태로 대체함.

**원본 소스 자산**: `바탕화면/캐릭터들.png` (사용자가 준 스프라이트시트, 8칸: 맨몸
포즈 5개 + 옷 입은 포즈 3개, 전부 나뭇가지 장식이 캐릭터 몸에 겹쳐 그려져 있어서
배경/나뭇가지 제거가 까다로웠음). 이 시트를 어떻게 처리했는지는 아래 6-3 참고.

**성장 단계 매핑** (`lib/growthStage.ts`):
```ts
STAGE1_MAX_LEVEL = 12  // 시작 단계
STAGE2_MAX_LEVEL = 20  // 도전 단계 (그 이상은 성공 단계)
```
기존 옷장 시스템(`lib/outfits.ts`, 레벨 1개당 옷 1개씩 28종)과는 **별개 시스템**임.
옷장 화면은 안 건드렸고, 이 growthStage 시스템은 Character.tsx 라이브 렌더링 전용.

## 6. 이번 세션에서 한 주요 작업 (시간순)

### 6-1. 홈 화면 정보 밀도 강화 (7개 항목 배치 작업)
1. `FoodPreview.tsx` — 오늘 받은 먹이 미니 섹션 (최근기록 4개, `GET /users/{id}/recent-logs`)
2. 구름 배경 애니메이션 — **시도했다가 원복함** (아래 8번 "되돌린 것" 참고)
3. 성취 배지 — `GET /users/{id}/stats` 신규 + `lib/badges.ts` 6종 + 설정화면 3열 그리드
4. 주간 요약 — `GET /users/{id}/weekly-summary` 신규 + `WeeklySummaryCard.tsx`
5. 퀘스트 완료 연출 — `QuestCompleteFx.tsx` (체크마크 드로잉 + XP 상승 + 컨페티)
6. 편지함 카드형 리스트 — 감정별 색점(`lib/emotionColors.ts`) + 날짜그룹(오늘/어제/이번주/이전)
7. 마이크로 인터랙션 — 주요 버튼 `whileTap`, 페이지 전환 통일(`PageTransition.tsx`)
8. 설정 화면 완성 — 계정정보/배지/안전안내(고정노출)/앱정보/로그아웃

### 6-2. 레벨업 시스템 재설계
- `LevelUpScreen.tsx`: 홈 화면 위 풀스크린 오버레이(라우팅 아님). 암전→반짝임→
  이전 옷 실루엣→플래시→새 옷 리빌+컨페티+"Lv.N 달성!"+계속하기.
- `/input`에서 레벨업 발생 시 `sessionStorage`(`teum:pending-levelup`)에 플래그
  남기고, 홈 도착 시 그걸 읽어서 표시.
- **버그 수정 이력**: React StrictMode(개발모드)가 마운트를 이중 시뮬레이션하면서
  effect가 플래그를 너무 일찍 지워버려 화면이 아예 안 뜨는 버그가 있었음 → "계속하기"
  누를 때만 지우도록 수정. (프로덕션 빌드였으면 안 터졌을 버그라 발견이 늦었음,
  비슷한 패턴 다른 곳에도 없는지 의심해볼 가치 있음)

### 6-3. 캐릭터 자산 파이프라인 (제일 시간 많이 씀)
사용자가 `캐릭터들.png` 스프라이트시트를 직접 만들어서 던져줌. 처리 과정:
1. 8칸 그리드 좌표 특정 (체크무늬=가짜 투명, 실제로는 불투명 PNG였음 — `alpha.min()==alpha.max()==255`로 항상 먼저 확인해야 함)
2. 배경 제거: 회색 체크무늬는 `sat<10 & lum>=150`, 초록 체크무늬는 `g>r+15 & g>b+10`
3. **나뭇가지 장식이 캐릭터 몸(특히 팔/다리)에 딱 붙어서 색상 기반 분리가 계속 실패함**
   → 최종 해법: `scipy.ndimage.binary_opening(fg, structure=np.ones((9,9)))`로 얇은
   연결부(나뭇가지 줄기)만 침식으로 끊어서 connected-components 분리 → 가장 큰
   덩어리(캐릭터) 선택 → 남은 자잘한 잔가지는 좌표 확인 후 수작업 사각형으로 제거.
   (이 스크립트들은 임시 스크래치패드에 있었고 지금은 정리됨 — 필요하면 이 문서의
   기법 설명만 보고 재현 가능)
4. 4포즈를 공통 캔버스(179x158)에 하단중앙 정렬로 배치 → `NATIVE` 상수 갱신.

### 6-4. 온보딩 인트로 연출 변경
- 문구: "얼룩이가 작은 친구를 데려왔어!" → "귀여운 새 얼룩이가 작은 친구를 데려왔어!"
- 얼룩이(왼쪽, 먼저 등장) → 700ms 후 플래시 → 950ms에 캐릭터(오른쪽) 팝업 등장,
  둘이 같은 baseline에 나란히 (`app/onboarding/page.tsx`의 `IntroStep`).

### 6-5. 스플래시 화면
- `frontend/public/assets/background/splash.png` (채영님이 만든 해변+로고 이미지)
- `LoadingScreen.tsx`가 배경으로 사용 — 이 컴포넌트는 `AppShell.tsx`의 전역
  세션확인 로딩 게이트에서 쓰이므로, 결과적으로 **앱 접속 직후 제일 먼저 보이는 화면**.

## 7. 되돌린 것 (참고용, 다시 시도하지 말 것)

- **홈 화면 구름 그라데이션 배경**: `.island-stage`에 하늘 그라데이션 + SVG 구름
  애니메이션(`CloudStrip.tsx`)을 만들어 넣었다가, 기존 `island.png` 일러스트(야자수/
  바다/조개)가 훨씬 낫다는 피드백으로 **완전히 되돌리고 컴포넌트 삭제함**. 홈 화면은
  다른 화면과 동일하게 `<IslandBackground blur={0} sunGlow>` 사용.

## 8. 알려진 이슈 / 다음에 할 일 (우선순위순)

1. **`eating.png`에 옷 입히기** — 채영님이 "옷 입고 입 벌린" 포즈를 새로 그려주면
   바로 교체 가능 (같은 179x158 캔버스, 같은 배경제거 파이프라인).
2. **`celebrating.png` 하체 복구** — 지금 상체만 보임. 원본 소스에서 다시 크롭하거나
   새로 받아야 함.
3. **`listening.png`을 idle과 다르게** — 지금은 완전 동일 파일이라 크로스페이드해도
   티가 안 남. 고개 기울임 등 별도 포즈 필요.
4. **`stage1/2/3.png` 옷 오버레이 자산** — 아직 없음. 채영님한테 요청한 상세 스펙이
   이전 대화에 있음(캔버스 통일, 안전여백, 입위치 고정 등) — 필요하면 그 대화 참고해서
   다시 요청.
5. 편지함 색점(`emotionColors.ts`)이나 배지 시스템은 실제 데이터로 검증 완료,
   구조 변경 불필요.
6. **옷장 화면(`app/closet/`)과 `lib/outfits.ts`의 28종 옷 시스템**은 이번 세션에서
   전혀 안 건드림 — Character.tsx의 새 3단계 시스템과 관계가 정리 안 된 상태
   (둘이 공존하는 게 맞는지, 옷장 화면도 새 시스템으로 통합해야 하는지는 미결정).

## 9. 디자인 토큰 (`app/globals.css`)

```
--color-main-green: #A8D5BA   --color-brown: #8A6A4E (텍스트 대비용으로 진하게 조정됨)
--color-bg: #FFFBF5           --color-yellow: #F6C453
--color-safety: #E8A19C (위기화면 전용)
--font-heading: GmarketSans   --font-body: Pretendard
--font-letter: MaruBuri (편지 본문)   --font-hand/font-jua: Gamja Flower / Jua (제목, 로고, 손글씨)
```
Pretendard는 `layout.tsx`의 `<head>`에 `<link>`로 로드 (globals.css에서 `@import`
하면 Tailwind v4 빌드 에러남, 실제로 겪었던 버그).

## 10. 검증 방법 (다음 AI가 참고할 것)

- 이 프로젝트엔 스크린샷 도구가 따로 없어서 Playwright를 매번 스크립트로 작성해서
  씀 (`npm install -D playwright` 이미 돼있음).
- 구글 로그인을 매번 다시 할 수 없으니, Supabase 세션 JSON을 `localStorage`의
  `sb-<project-ref>-auth-token` 키에 주입해서 로그인 우회함. 프로젝트 ref는
  `vpmwqjrxhysifsmmdbci`. 테스트 계정(레벨12, 기록 다수, 퀘스트 완료 이력 있음)의
  세션이 스크래치패드의 `session.json`에 있었음(만료됐을 수 있음, 새로 로그인해서
  `localStorage.getItem('sb-...-auth-token')`으로 새로 뽑으면 됨).
- Playwright 스크립트(`.mjs`)는 반드시 `frontend/` 디렉토리 **안에서** 실행해야
  `node_modules/playwright`를 찾음 (스크래치패드에서 실행하면 모듈 못 찾음).
  작업 끝나면 `rm`으로 지워서 git 상태 깨끗하게 유지.

## 11. 이 세션에서 배운 사용자 성향 (톤 참고용)

- 코드/화면이 실제로 깨지는 것에 매우 민감함 — "완벽하게" 동작하는지 직접 확인하고
  보고하길 원함. 스크린샷/라이브 확인 없이 "됐다"고 보고하면 신뢰를 잃음.
- 큰 배치 작업 지시 후에는 "확인은 내가 직접 할 것"이라고 하기도 함 — 그럴 땐
  상태 점검만 하고 서버만 켜주면 됨, 과도하게 자동화된 검증을 들이밀지 말 것.
- 배경/색감 등 이미 괜찮았던 부분을 임의로 크게 바꾸면 (설령 이전 요청사항이었어도)
  실제로 보고 별로면 즉시 원복 요청함 — 자기 검증(스크린샷)보다 실제 화면 임팩트가
  기준.
