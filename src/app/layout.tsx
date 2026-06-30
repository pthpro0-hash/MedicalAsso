import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "촉탁의 추천관리 시스템",
  description: "지역의사협의회 관리자용 촉탁의 추천 행정관리 MVP"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
