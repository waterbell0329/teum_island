"use client";

// 입력 -> 요정 소환/듣기 -> 캐치/먹기 -> 편지 결과 흐름 (PROJECT_SUMMARY 5번 섹션).
// /input 페이지와 온보딩의 "먹이주기 튜토리얼" 단계가 이 컴포넌트를 공유해서 씀
// (둘 다 결국 같은 POST /emotion-logs 흐름이라서).
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InputFlow, { INPUT_DRAFT_KEYS } from "@/components/InputFlow";
import RotatingCaption from "@/components/RotatingCaption";
import Character, { type CharacterAnimationState } from "@/components/Character";
import Fairy, { type FairyState } from "@/components/Fairy";
import FoodIcon from "@/components/FoodIcon";
import LetterPaper from "@/components/LetterPaper";
import { createEmotionLog, ApiError } from "@/lib/api";
import { clearSession, readSession, writeSession } from "@/lib/sessionDraft";
import { useUser } from "@/context/UserContext";
import type { EmotionLogCreate, EmotionLogResponse, EmotionLogSubmit } from "@/types/emotion";

// understood: 요정이 응답을 받고 나서 "알아챘다"는 반응을 짧게 보여주는 단계
// (채영님이 보내주신 4컷 제스처 참고자료 4번 "경청 후 반응" 반영, 듣기<->전달 사이에 낌)
// 2026-09-20 흐름 개편: 캐릭터가 직접 "먹는" 연출(eating) 제거.
// 대신: 마음이 먹이로 바뀌어 화면에 톡 나타나고(feeding) -> 캐릭터가 그 먹이를 받아
// 편지를 적고 얼룩이가 가져오는 중(writing) -> 편지 결과(result).
type Phase =
  | "form"
  | "listening"
  | "understood"
  | "feeding"
  | "writing"
  | "celebrating"
  | "result"
  | "crisis"
  | "error";

const UNDERSTOOD_DURATION_MS = 700;
const FEEDING_DURATION_MS = 1500; // 먹이가 나타나서 "먹였어요"까지
const WRITING_DURATION_MS = 1700; // 캐릭터가 편지 적고 얼룩이가 가져오는 중

// 응답 대기 문구 -- 실제로는 편지 풀에서 즉시 서빙돼서 보통 1~2초면 끝나므로 짧은 간격으로 순환
const LISTENING_MESSAGES = ["얼룩이가 글을 읽고 있어요", "천천히 숨 쉬어도 괜찮아요", "마음을 살펴보는 중이에요"];

interface EmotionCaptureFlowProps {
  userId: string;
  /** 결과 화면 하단 버튼 문구 (기본 "홈으로") */
  ctaLabel?: string;
  /** 결과 확인 후 버튼 눌렀을 때 (부모가 홈 이동이든 다음 온보딩 단계든 알아서 처리) */
  onDone: (result: EmotionLogResponse) => void;
}

interface StoredResult {
  phase: "result" | "crisis";
  result: EmotionLogResponse;
}

export default function EmotionCaptureFlow({ userId, ctaLabel = "홈으로", onDone }: EmotionCaptureFlowProps) {
  const { user } = useUser();
  // 3-1. 새로고침 시 결과 화면 유실 방지: 유저별 sessionStorage 키에 마지막 결과 저장/복원
  const resultKey = `teum:result:${userId}`;
  const restored = useRef(false);
  const [phase, setPhase] = useState<Phase>(() => {
    const saved = readSession<StoredResult | null>(resultKey, null);
    return saved ? saved.phase : "form";
  });
  const [result, setResult] = useState<EmotionLogResponse | null>(() => {
    const saved = readSession<StoredResult | null>(resultKey, null);
    return saved ? saved.result : null;
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 결과/안전화면에 들어와 있는 동안엔 저장해두고, 다른 단계로 넘어가면(새 제출/완료) 지움
  useEffect(() => {
    if (phase === "result" || phase === "crisis") {
      writeSession(resultKey, { phase, result } as StoredResult);
    } else if (restored.current) {
      // 복원 직후 첫 렌더는 건드리지 않음 -- form/listening 등으로 실제로 넘어갈 때만 정리
      clearSession(resultKey);
    }
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // 결과 화면을 보고 있는 도중 새로고침/탭닫기 시 한 번 더 확인 (요구사항 3-1 추가조치)
  useEffect(() => {
    if (phase !== "result" && phase !== "crisis") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  async function handleSubmit(data: EmotionLogSubmit) {
    // 폼 내용은 이미 넘겨받았으니 임시저장해둔 초안은 정리
    clearSession(INPUT_DRAFT_KEYS.path);
    clearSession(INPUT_DRAFT_KEYS.freeText);
    clearSession(INPUT_DRAFT_KEYS.structured);

    setSubmitting(true);
    setPhase("listening");
    try {
      const res = await createEmotionLog({ user_id: userId, ...data } as EmotionLogCreate);

      if (res.id === "crisis") {
        setResult(res);
        setPhase("crisis");
        return;
      }

      setResult(res);
      setPhase("understood");
      setTimeout(() => setPhase("feeding"), UNDERSTOOD_DURATION_MS);
    } catch (e) {
      setErrorMsg(e instanceof ApiError ? e.message : "얼룩이가 잠깐 딴 데를 봤나봐, 다시 한 번 눌러줄래?");
      setPhase("error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDone() {
    clearSession(resultKey);
    if (result) onDone(result);
  }

  // feeding -> writing -> (celebrating) -> result 자동 진행.
  // 캐릭터가 직접 먹는 연출은 없앴으므로, 각 단계는 타이머로만 넘어간다.
  useEffect(() => {
    if (phase === "feeding") {
      const t = setTimeout(() => setPhase("writing"), FEEDING_DURATION_MS);
      return () => clearTimeout(t);
    }
    if (phase === "writing") {
      const next = result?.leveled_up ? "celebrating" : "result";
      const t = setTimeout(() => setPhase(next), WRITING_DURATION_MS);
      return () => clearTimeout(t);
    }
    if (phase === "celebrating") {
      const t = setTimeout(() => setPhase("result"), 1500);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const characterState: CharacterAnimationState = phase === "celebrating" ? "celebrating" : "idle";
  const fairyState: FairyState =
    phase === "listening"
      ? "listening"
      : phase === "understood"
        ? "understood"
        : phase === "writing" || phase === "celebrating"
          ? "deliver"
          : "hidden";

  if (phase === "form") {
    return <InputFlow onSubmit={handleSubmit} disabled={submitting} />;
  }

  if (
    phase === "listening" ||
    phase === "understood" ||
    phase === "feeding" ||
    phase === "writing" ||
    phase === "celebrating"
  ) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Fairy state={fairyState} size={90} />

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Character animationState={characterState} size={200} level={user?.level} />

          {/* feeding: 마음이 먹이로 바뀌어 캐릭터 앞에 톡 나타났다가, 캐릭터에게 건네짐 */}
          <AnimatePresence>
            {phase === "feeding" && result?.emotion && (
              <motion.div
                key="food"
                initial={{ opacity: 0, scale: 0.3, y: -40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 10 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                style={{ position: "absolute", top: -8 }}
              >
                <FoodIcon emotion={result.emotion} size={56} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {phase === "listening" ? (
          // 채영님 개선안(2026-09-18): 대기 중엔 한 줄 고정 대신 여러 문장을 짧은 간격으로 전환
          <RotatingCaption messages={LISTENING_MESSAGES} intervalMs={1300} style={{ fontSize: 14 }} />
        ) : (
          <p style={{ fontSize: 14, color: "var(--color-brown)", textAlign: "center", lineHeight: 1.6, maxWidth: 260 }}>
            {phase === "understood" && "얼룩이가 마음을 알아챘어!"}
            {phase === "feeding" && "마음이 먹이가 되어 도착했어요"}
            {phase === "writing" && "캐릭터가 편지를 적고,\n얼룩이가 편지를 가져오는 중이에요"}
            {phase === "celebrating" && "축하해요! 새 옷을 입었어요"}
          </p>
        )}
      </div>
    );
  }

  if (phase === "crisis" && result) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "var(--space-5)" }}>
        {/* 안전화면: 캐릭터 톤 배제, 명확하고 차분한 안내문 (CLAUDE_1.md 마이크로카피 예외) */}
        <div
          style={{
            background: "var(--color-safety)",
            color: "var(--color-text)",
            padding: "var(--space-5)",
            borderRadius: "var(--radius-card)",
            whiteSpace: "pre-line",
            lineHeight: 1.6,
          }}
        >
          {result.letter_text}
        </div>
        <button onClick={handleDone} style={ctaStyle}>
          {ctaLabel}
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, padding: "var(--space-5)" }}>
        <LetterPaper>
          <p className="font-letter" style={{ fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-line" }}>
            {result.letter_text}
          </p>
        </LetterPaper>

        <div style={{ fontSize: 13, color: "var(--color-brown)", textAlign: "center" }}>
          {result.xp_earned > 0 ? `+${result.xp_earned} XP ` : ""}
          {result.leveled_up && `· 레벨 ${result.new_level} 달성!`}
        </div>

        {result.today_quests?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <p style={{ fontSize: 13, color: "var(--color-brown)" }}>오늘의 가벼운 루틴</p>
            {result.today_quests.map((q) => (
              <div
                key={q.id}
                style={{
                  padding: "var(--space-3)",
                  borderRadius: "var(--radius-card)",
                  background: "#fff",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                <strong style={{ fontSize: 14 }}>{q.title}</strong>
                <p style={{ fontSize: 12, color: "var(--color-brown)", margin: "4px 0 0" }}>{q.description}</p>
              </div>
            ))}
          </div>
        )}

        <button onClick={handleDone} style={ctaStyle}>
          {ctaLabel}
        </button>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "var(--space-5)" }}>
        <p style={{ color: "var(--color-text)" }}>{errorMsg}</p>
        <button onClick={() => setPhase("form")} style={ctaStyle}>
          다시 해보기
        </button>
      </div>
    );
  }

  return null;
}

const ctaStyle = {
  padding: "14px",
  borderRadius: "var(--radius-control)",
  border: "none",
  background: "var(--color-main-green)",
  color: "var(--color-text)",
  fontFamily: "var(--font-heading)",
  fontSize: 15,
  cursor: "pointer",
} as const;
