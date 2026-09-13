import type { Metadata, Viewport } from "next";
import { Gamja_Flower, Jua } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/UserContext";
import AppShell from "@/components/AppShell";

const gamja = Gamja_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-gamja",
});
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-jua",
});

export const metadata: Metadata = {
  title: "틈 아일랜드",
  description: "거친 말은 걸러지고, 마음만 남아요 — 하루의 작은 쉼표",
  manifest: "/manifest.json",
  openGraph: {
    title: "틈 아일랜드",
    description: "거친 말은 걸러지고, 마음만 남아요",
    // 실제 미리보기 이미지는 app/opengraph-image.png 파일을 Next.js가 자동으로 찾아서 붙여줌
    // (별도로 images 필드에 안 적어도 됨 -- App Router 파일 컨벤션, 2026-09-14 추가)
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 핀치줌 방지 (앱처럼 보이게)
  viewportFit: "cover", // 노치/펀치홀 화면에서 safe-area-inset이 실제로 값을 갖게 하려면 필요
  themeColor: "#A8D5BA",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${gamja.variable} ${jua.variable}`}>
      <body style={{ margin: 0, overscrollBehaviorY: "contain" /* pull-to-refresh 방지 */ }}>
        <UserProvider>
          <div className="app-frame">
            <AppShell>{children}</AppShell>
          </div>
        </UserProvider>
      </body>
    </html>
  );
}
