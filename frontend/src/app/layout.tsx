import type { Metadata } from 'next';
import './globals.css';
import { FinShieldProvider } from '@/context/FinShieldContext';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'FinShield — Personal Finance',
  description:
    'Track spending, manage budgets, split bills, and plan savings and loans.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-[#1C1C1E] selection:text-white">
        <FinShieldProvider>
          <AppShell>{children}</AppShell>
        </FinShieldProvider>
      </body>
    </html>
  );
}
