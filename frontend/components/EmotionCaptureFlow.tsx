"use client";

// 입력 -> 요정 소환/듣기 -> 캐치/먹기 -> 편지 결과 흐름 (PROJECT_SUMMARY 5번 섹션).
// /input 페이지와 온보딩의 "먹이주기 튜토리얼" 단계가 이 컴포넌트를 공유해서 씀
// (둘 다 결국 같은 POST /emotion-logs 흐름이라서).
import { useEffect, useRef, useState } from "react";
import InputFlow, { INPUT_DRAFT_KEYS } from "@/components/InputFlow";
import Character, { type CharacterAnimationState } from "@/components/Character";
import Fairy, { type FairyState } from "@/components/Fairy";
import LetterPaper from "@/components/LetterPaper";
import { createEmotionLog, ApiError } from "@/lib/api";
import { clearSession, readSession, writeSession } from "@/lib/sessionDraft";
import { useUser } from "@/context/UserContext";
import type { EmotionLogCreate, EmotionLogResponse, EmotionLogSubmit } from "@/types/emotion";

// understood: 요정이 응답을 받고 나서 "알아챘다"는 반응을 짧게 보여주는 단계
// (채영님이 보내주신 4컷 제스처 참고자료 4번 "경청 후 반응" 반영, 듣기<->전달 사이에 낌)
type Phase = "form" | "listening" | "understood" | "eating" | "celebrating" | "result" | "crisis" | "error";

const UNDERSTOOD_DURATION_MS = 700;

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
      setTimeout(() => setPhase("eating"), UNDERSTOOD_DURATION_MS);
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

  function handleEatingComplete() {
    if (result?.leveled_up) {
      setPhase("celebrating");
      setTimeout(() => setPhase("result"), 1300);
    } else {
      setPhase("result");
    }
  }

  const characterState: CharacterAnimationState =
    phase === "eating" ? "eating" : phase === "celebrating" ? "celebrating" : "idle";
  const fairyState: FairyState =
    phase === "listening"
      ? "listening"
      : phase === "understood"
        ? "understood"
        : phase === "eating" || phase === "celebrating"
          ? "deliver"
          : "hidden";

  if (phase === "form") {
    return <InputFlow onSubmit={handleSubmit} disabled={submitting} />;
  }

  if (phase === "listening" || phase === "understood" || phase === "eating" || phase === "celebrating") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <Fairy state={fairyState} size={90} />
        <Character
          animationState={characterState}
          size={200}
          onEatingComplete={handleEatingComplete}
          foodEmotion={result?.emotion}
          level={user?.level}
        />
        <p style={{ fontSize: 14, color: "var(--color-brown)" }}>
          {phase === "listening"
            ? "얼룩이가 듣고 있어..."
            : phase === "understood"
              ? "얼룩이가 마음을 알아챘어!"
              : "냠냠, 잘 받아먹었대"}
        </p>
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
          <p className="font-hand" style={{ fontSize: 17, lineHeight: 1.7, whiteSpace: "pre-line" }}>
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
  fontFamily: "var(--font-jua)",
  fontSize: 15,
  cursor: "pointer",
} as const;
