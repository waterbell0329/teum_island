"use client";

// 편지 봉투. 두 군데서 씀: (1) 편지 도착 연출(arriving), (2) 편지함 목록 아이템(list)
import { motion } from "framer-motion";

const ENVELOPE_ASSET: string | null = "/assets/icons/letter-envelope.png";

interface LetterEnvelopeProps {
  variant?: "arriving" | "list";
  size?: number;
  opened?: boolean;
  onClick?: () => void;
}

export default function LetterEnvelope({ variant = "list", size = 64, opened = false, onClick }: LetterEnvelopeProps) {
  const content = (
    <div
      style={{
        width: size,
        height: size * 0.72,
        borderRadius: 8,
        background: ENVELOPE_ASSET ? "transparent" : "#F5EFE0",
        backgroundImage: ENVELOPE_ASSET ? `url(${ENVELOPE_ASSET})` : undefined,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        border: ENVELOPE_ASSET ? undefined : "1px solid #E5DCC9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        opacity: opened ? 0.6 : 1,
      }}
    >
      {!ENVELOPE_ASSET && (
        <div
          style={{
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: "50%",
            background: "#B08968",
          }}
        />
      )}
    </div>
  );

  if (variant === "arriving") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.6 }}
        animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: "backOut" } }}
        onClick={onClick}
        style={{ cursor: onClick ? "pointer" : undefined }}
      >
        {content}
      </motion.div>
    );
  }

  // 2026-09-15: 편지함 목록에서는 이 컴포넌트 자체가 이미 <button>인 부모(letters/page.tsx의
  // 행 버튼) 안에 또 들어가는데, onClick 없이도 항상 <button>으로 감싸고 있어서 button 안에
  // button이 중첩되는 HTML 오류(+ hydration 경고)가 있었음. onClick이 실제로 있을 때만
  // 버튼으로 감싸고, 없으면(순수 장식용) 평범한 div로 렌더링.
  if (onClick) {
    return (
      <button onClick={onClick} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
        {content}
      </button>
    );
  }
  return <div>{content}</div>;
}
