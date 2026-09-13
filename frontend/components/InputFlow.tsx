"use client";

// 입력 플로우 -- 경로 A(편하게 쓰기, 자유텍스트) / 경로 B(빠르게 골라서 전하기, 구조화입력)
// PROJECT_SUMMARY.md 5번 섹션 원안 그대로 둘 다 제공.
// ⚠️ 경로 A는 지금 백엔드가 막아놨음(LoRA 분류기 속도 문제로 공개버전 제외 결정) --
// UI는 열어두되, 제출하면 백엔드가 안내 메시지를 돌려주고 부모(app/input/page.tsx)가
// 그대로 에러 화면에 보여주는 구조.
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import type { Emotion, SituationCategory, Intensity, EmotionLogSubmit } from "@/types/emotion";
import { readSession, writeSession } from "@/lib/sessionDraft";

export const INPUT_DRAFT_KEYS = {
  path: "teum:input:path",
  freeText: "teum:input:freeText",
  structured: "teum:input:structured",
} as const;
const DRAFT_KEYS = INPUT_DRAFT_KEYS;

type StructuredSubmit = Extract<EmotionLogSubmit, { input_type: "structured" }>;
type FreeTextSubmit = Extract<EmotionLogSubmit, { input_type: "free_text" }>;

const SITUATIONS: SituationCategory[] = ["직장/알바", "인간관계", "학업/진로", "미래불안", "기타"];
const EMOTIONS: Emotion[] = [
  "분노", "억울함", "무기력", "막막함", "서운함", "불안함", "지침",
  "뿌듯함", "설렘", "안심", "감사함", "홀가분함",
];
const INTENSITIES: { value: Intensity; label: string }[] = [
  { value: 1, label: "약간" },
  { value: 2, label: "많이" },
  { value: 3, label: "정말" },
];

interface InputFlowProps {
  onSubmit: (data: StructuredSubmit | FreeTextSubmit) => void;
  disabled?: boolean;
}

export default function InputFlow({ onSubmit, disabled }: InputFlowProps) {
  const [path, setPath] = useState<"free_text" | "structured">(() =>
    readSession(DRAFT_KEYS.path, "structured" as "free_text" | "structured")
  );

  useEffect(() => {
    writeSession(DRAFT_KEYS.path, path);
  }, [path]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      <div style={{ display: "flex", gap: 8, padding: "0 var(--space-4)" }}>
        <PathTab active={path === "free_text"} onClick={() => setPath("free_text")}>
          편하게 쓰기
        </PathTab>
        <PathTab active={path === "structured"} onClick={() => setPath("structured")}>
          빠르게 골라서 전하기
        </PathTab>
      </div>

      {path === "free_text" ? (
        <FreeTextForm onSubmit={onSubmit} disabled={disabled} />
      ) : (
        <StructuredForm onSubmit={onSubmit} disabled={disabled} />
      )}
    </div>
  );
}

function PathTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "10px 8px",
        borderRadius: "var(--radius-control)",
        border: active ? "2px solid var(--color-main-green)" : "1px solid #E5DCC9",
        background: active ? "#EAF3EE" : "#fff",
        color: "var(--color-text)",
        fontFamily: "var(--font-jua)",
        fontSize: 13,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function FreeTextForm({ onSubmit, disabled }: { onSubmit: (d: FreeTextSubmit) => void; disabled?: boolean }) {
  const [text, setText] = useState(() => readSession(DRAFT_KEYS.freeText, ""));
  const ready = text.trim().length > 0;

  useEffect(() => {
    writeSession(DRAFT_KEYS.freeText, text);
  }, [text]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "0 var(--space-4)" }}>
      <Label>오늘 하루, 편하게 얘기해줘</Label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={1000}
        rows={8}
        placeholder="무슨 일이 있었는지, 어떤 기분이었는지 편하게 적어봐"
        style={{
          width: "100%",
          padding: "var(--space-3)",
          borderRadius: "var(--radius-control)",
          border: "1px solid #E5DCC9",
          fontFamily: "var(--font-jua)",
          fontSize: 14,
          resize: "none",
          boxSizing: "border-box",
        }}
      />
      <SubmitButton
        ready={ready}
        disabled={disabled}
        onClick={() => ready && onSubmit({ input_type: "free_text", raw_text: text })}
      />
    </div>
  );
}

function StructuredForm({
  onSubmit,
  disabled,
}: {
  onSubmit: (d: StructuredSubmit) => void;
  disabled?: boolean;
}) {
  const draft = readSession(DRAFT_KEYS.structured, {
    situation: null as SituationCategory | null,
    emotion: null as Emotion | null,
    intensity: null as Intensity | null,
    note: "",
  });
  const [situation, setSituation] = useState<SituationCategory | null>(draft.situation);
  const [emotion, setEmotion] = useState<Emotion | null>(draft.emotion);
  const [intensity, setIntensity] = useState<Intensity | null>(draft.intensity);
  const [note, setNote] = useState(draft.note);

  useEffect(() => {
    writeSession(DRAFT_KEYS.structured, { situation, emotion, intensity, note });
  }, [situation, emotion, intensity, note]);

  const ready = situation && emotion && intensity;

  const chip = (active: boolean): CSSProperties => ({
    padding: "8px 14px",
    borderRadius: "var(--radius-control)",
    border: active ? "2px solid var(--color-main-green)" : "1px solid #E5DCC9",
    background: active ? "#EAF3EE" : "#fff",
    color: "var(--color-text)",
    fontFamily: "var(--font-jua)",
    fontSize: 14,
    cursor: "pointer",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)", padding: "0 var(--space-4)" }}>
      <section>
        <Label>어떤 상황이었어?</Label>
        <Row>
          {SITUATIONS.map((s) => (
            <button key={s} style={chip(situation === s)} onClick={() => setSituation(s)}>
              {s}
            </button>
          ))}
        </Row>
      </section>

      <section>
        <Label>어떤 감정이 들었어?</Label>
        <Row>
          {EMOTIONS.map((e) => (
            <button key={e} style={chip(emotion === e)} onClick={() => setEmotion(e)}>
              {e}
            </button>
          ))}
        </Row>
      </section>

      <section>
        <Label>얼마나?</Label>
        <Row>
          {INTENSITIES.map((i) => (
            <button key={i.value} style={chip(intensity === i.value)} onClick={() => setIntensity(i.value)}>
              {i.label}
            </button>
          ))}
        </Row>
      </section>

      <section>
        <Label>한 줄로 더 얘기해줄래? (선택)</Label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="안 써도 괜찮아"
          style={{
            width: "100%",
            padding: "var(--space-3)",
            borderRadius: "var(--radius-control)",
            border: "1px solid #E5DCC9",
            fontFamily: "var(--font-jua)",
            fontSize: 14,
            resize: "none",
            boxSizing: "border-box",
          }}
        />
      </section>

      <SubmitButton
        ready={!!ready}
        disabled={disabled}
        onClick={() =>
          ready &&
          onSubmit({
            input_type: "structured",
            situation_category: situation,
            emotion,
            intensity,
            raw_text: note || undefined,
          })
        }
      />
    </div>
  );
}

function SubmitButton({ ready, disabled, onClick }: { ready: boolean; disabled?: boolean; onClick: () => void }) {
  // disabled(=제출 처리 중)와 ready=false(=아직 다 안 골랐음)는 다른 상황이라 문구도 다르게
  // (3-3. 연타 방지: 처리 중엔 버튼을 눌러도 반응 없고 문구도 바뀌어서 눈으로 바로 알 수 있게)
  const inactive = !ready || disabled;
  return (
    <button
      disabled={inactive}
      onClick={onClick}
      style={{
        padding: "14px",
        borderRadius: "var(--radius-control)",
        border: "none",
        background: inactive ? "#D8D0C0" : "var(--color-main-green)",
        color: "var(--color-text)",
        fontFamily: "var(--font-jua)",
        fontSize: 16,
        cursor: inactive ? "not-allowed" : "pointer",
      }}
    >
      {disabled ? "얼룩이에게 전하는 중..." : "먹여주기"}
    </button>
  );
}

function Label({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 13, color: "var(--color-brown)", marginBottom: 8 }}>{children}</p>;
}
function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{children}</div>;
}
