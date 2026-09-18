"use client";

// 여러 문장을 일정 간격으로 부드럽게 페이드 전환하며 보여주는 캡션.
// 응답을 기다리는 동안 한 줄 고정 문구 대신 써서 "살아있는" 느낌을 주기 위함
// (채영님 개선안, 2026-09-18 -- LoadingScreen.tsx와 같은 원리, 작은 캡션용).
import { useEffect, useState } from "react";

export default function RotatingCaption({
  messages,
  intervalMs = 5000,
  style,
}: {
  messages: string[];
  intervalMs?: number;
  style?: React.CSSProperties;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);

  return (
    <>
      <p
        key={index}
        className="rotating-caption"
        style={{ fontSize: 14, color: "var(--color-brown)", textAlign: "center", ...style }}
      >
        {messages[index]}
      </p>
      <style jsx>{`
        .rotating-caption {
          animation: rotating-caption-fade ${intervalMs}ms ease-in-out;
        }
        @keyframes rotating-caption-fade {
          0% {
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            opacity: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .rotating-caption {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
