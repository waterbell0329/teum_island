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
  openGraph: {
    title: "틈 아일랜드",
    description: "거친 말은 걸러지고, 마음만 남아요",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // 핀치줌 방지 (앱처럼 보이게)
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
