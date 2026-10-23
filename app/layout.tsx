import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "物语工坊 · 产品视觉工作台",
  description: "上传两张产品实拍，生成一张主图与九张有故事的电商副图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
