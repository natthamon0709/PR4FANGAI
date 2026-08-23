import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PR4Fang AI — ระบบจัดการองค์ความรู้ วิทยาลัยการอาชีพฝาง',
  description: 'ระบบจัดการองค์ความรู้และการบริหารงาน วิทยาลัยการอาชีพฝาง',
  icons: {
    icon: '/img/logofve.png',
    shortcut: '/img/logofve.png',
    apple: '/img/logofve.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-screen flex flex-col bg-surface text-onSurface">
        {children}
      </body>
    </html>
  );
}
