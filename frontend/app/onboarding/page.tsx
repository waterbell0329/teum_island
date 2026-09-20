"use client";

// 최초 로그인 유저 온보딩. PROJECT_SUMMARY 3번 섹션 원안대로 단계화:
//   1) 닉네임 입력 -> 2) 펫+요정 등장 -> 3) 먹이주기 튜토리얼(진짜 첫 기록)
//   -> 4) 펫 이름짓기 -> 5) complete-onboarding(level 0->1) -> 홈
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "@/components/Logo";
import Character from "@/components/Character";
import Fairy from "@/components/Fairy";
import IslandBackground from "@/components/IslandBackground";
import EmotionCaptureFlow from "@/components/EmotionCaptureFlow";
import { saveNickname, completeOnboarding } from "@/lib/api";
import { useUser } from "@/context/UserContext";

type Step = "nickname" | "intro" | "tutorial" | "petname";

export default function OnboardingPage() {
  const router = useRouter();
  const { userId, refreshUser } = useUser();
  const [step, setStep] = useState<Step>("nickname");
  const [error, setError] = useState("");

  if (!userId) return null;

  return (
    <IslandBackground>
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-5)",
        }}
      >
        {step === "nickname" && (
          <NicknameStep
            userId={userId}
            error={error}
            onNext={async (name) => {
              try {
                await saveNickname(userId, name);
                setError("");
                setStep("intro");
              } catch {
                setError("얼룩이가 잠깐 딴 데를 봤나봐, 다시 한 번 눌러줄래?");
              }
            }}
          />
        )}

        {step === "intro" && <IntroStep onNext={() => setStep("tutorial")} />}

        {step === "tutorial" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <p style={{ textAlign: "center", fontFamily: "var(--font-heading)", fontSize: 14, padding: "var(--space-4)" }}>
              첫 먹이를 줘볼까? 오늘 하루는 어땠어?
            </p>
            <EmotionCaptureFlow userId={userId} ctaLabel="다음" onDone={() => setStep("petname")} />
          </div>
        )}

        {step === "petname" && (
          <PetNameStep
            error={error}
            onSubmit={async (petName) => {
              try {
                await completeOnboarding(userId, petName);
                await refreshUser();
                router.replace("/");
              } catch {
                setError("얼룩이가 잠깐 딴 데를 봤나봐, 다시 한 번 눌러줄래?");
              }
            }}
          />
        )}
      </div>
    </IslandBackground>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--space-5)",
        padding: "var(--space-5)",
      }}
    >
      {children}
    </div>
  );
}

function NicknameStep({
  onNext,
  error,
}: {
  userId: string;
  error: string;
  onNext: (nickname: string) => void;
}) {
  const [nickname, setNickname] = useState("");
  return (
    <Centered>
      <Logo />
      <Character animationState="idle" size={160} />
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>만나서 반가워! 뭐라고 부르면 될까?</p>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={12}
        placeholder="닉네임"
        style={inputStyle}
      />
      {error && <p style={{ color: "var(--color-safety)", fontSize: 13 }}>{error}</p>}
      <button disabled={!nickname.trim()} onClick={() => onNext(nickname.trim())} style={buttonStyle(!!nickname.trim())}>
        다음
      </button>
    </Centered>
  );
}

function IntroStep({ onNext }: { onNext: () => void }) {
  // 2026-09-20: 얼룩이가 먼저 등장 -> 빛 번쩍 -> 그 오른쪽 동일선상에 캐릭터가 등장하는
  // 연출로 변경 (기존엔 위아래로 쌓아뒀는데, 나란히 놓고 순서를 두는 쪽으로 요청받음).
  const [phase, setPhase] = useState<"fairy" | "flash" | "reveal">("fairy");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("flash"), 700);
    const t2 = setTimeout(() => setPhase("reveal"), 950);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <Centered>
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 15, textAlign: "center" }}>
        귀여운 새 얼룩이가 작은 친구를 데려왔어!
      </p>
      <div style={{ position: "relative", width: 280, height: 190, display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4 }}>
        <Fairy state="summon" size={90} />

        <AnimatePresence>
          {phase === "flash" && (
            <motion.div
              key="flash"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                position: "absolute",
                right: 20,
                bottom: 40,
                width: 90,
                height: 90,
                borderRadius: "50%",
                background: "#fff",
                zIndex: 3,
              }}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "reveal" && (
            <motion.div
              key="character"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <Character animationState="idle" size={170} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <p style={{ fontSize: 13, color: "var(--color-brown)", textAlign: "center", maxWidth: 280 }}>
        이 친구는 네가 들려주는 하루 이야기를 먹고 자라. 거친 말은 걸러지고, 마음만 남아서 편지로 돌아올 거야.
      </p>
      <button onClick={onNext} style={buttonStyle(true)}>
        다음
      </button>
    </Centered>
  );
}

function PetNameStep({ onSubmit, error }: { onSubmit: (petName: string) => void; error: string }) {
  const [petName, setPetName] = useState("");
  return (
    <Centered>
      <Character animationState="celebrating" size={170} />
      <p style={{ fontFamily: "var(--font-heading)", fontSize: 15 }}>맛있게 먹었어! 이 친구 이름은 뭐라고 지어줄까?</p>
      <input
        value={petName}
        onChange={(e) => setPetName(e.target.value)}
        maxLength={12}
        placeholder="펫 이름"
        style={inputStyle}
      />
      {error && <p style={{ color: "var(--color-safety)", fontSize: 13 }}>{error}</p>}
      <button disabled={!petName.trim()} onClick={() => onSubmit(petName.trim())} style={buttonStyle(!!petName.trim())}>
        시작하기
      </button>
    </Centered>
  );
}

const inputStyle = {
  width: "100%",
  maxWidth: 280,
  padding: "12px 16px",
  borderRadius: "var(--radius-control)",
  border: "1px solid #E5DCC9",
  fontFamily: "var(--font-body)",
  fontSize: 15,
  textAlign: "center",
  boxSizing: "border-box",
} as const;

function buttonStyle(active: boolean) {
  return {
    width: "100%",
    maxWidth: 280,
    padding: "14px",
    borderRadius: "var(--radius-control)",
    border: "none",
    background: active ? "var(--color-main-green)" : "#D8D0C0",
    color: "var(--color-text)",
    fontFamily: "var(--font-heading)",
    fontSize: 15,
    cursor: active ? "pointer" : "not-allowed",
  } as const;
}
