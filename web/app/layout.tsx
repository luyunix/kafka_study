import type { Metadata } from "next";
import "./globals.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://luyunix.github.io/kafka_study/"),
  title: "Kafka Study｜从入门到 KRaft 集群",
  description: "156 节 Kafka 中文课程笔记、概念搜索、学习进度和实操命令速查。",
  openGraph: {
    title: "Kafka Study｜从入门到 KRaft 集群",
    description: "156 节 Kafka 中文课程笔记与学习工作台",
    images: [`${basePath}/og.png`],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kafka Study｜从入门到 KRaft 集群",
    description: "156 节 Kafka 中文课程笔记与学习工作台",
    images: [`${basePath}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
