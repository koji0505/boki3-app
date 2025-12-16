import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '日商簿記3級 仕訳問題',
  description: '15問の仕訳問題を15分以内に解く練習アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
