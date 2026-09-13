// 로고. 이미지 파일 대신 실제 폰트(Gamja Flower)로 재현 -- 텍스트라서 이미지 저장 문제 없이
// 정확한 색상/폰트로 만들 수 있고, 나중에 문구가 바뀌어도 코드만 고치면 됨.
export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const titleSize = size === "lg" ? 40 : size === "md" ? 28 : 20;
  const subSize = size === "lg" ? 16 : size === "md" ? 13 : 11;

  return (
    <div style={{ textAlign: "center" }}>
      <div
        className="font-hand"
        style={{ fontSize: titleSize, color: "var(--color-main-green)", lineHeight: 1.2 }}
      >
        틈 아일랜드<span style={{ color: "var(--color-brown)" }}>,</span>
      </div>
      <div style={{ fontSize: subSize, color: "#6B8CB8", marginTop: 2 }}>하루의 작은 쉼표</div>
    </div>
  );
}
