import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "甘田 Goodland-food | 港式茶飲文化的創新者",
  description:
    "甘田食品科技 — 專注港式奶茶文化。從三點三拼配茶、立陶宛淡奶,到全球首創快速煮茶機,讓好茶更簡單。",
  keywords: ["甘田", "Goodland", "港式奶茶", "三點三", "煮茶機", "快速煮茶"],
  openGraph: {
    title: "甘田 Goodland-food",
    description: "港式茶飲文化的創新者 — 食品科技公司",
    type: "website",
    locale: "zh_TW",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen antialiased">
        <Navbar />
        <main className="pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
