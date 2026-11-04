import type { Metadata } from 'next';
import { Inter, Inter_Tight, Instrument_Serif, Michroma } from 'next/font/google';
import './globals.css';
import './marketing.css';
import { FinShieldProvider } from '@/context/FinShieldContext';
import { AppShell } from '@/components/AppShell';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-inter-tight',
});
const michroma = Michroma({ subsets: ['latin'], weight: '400', variable: '--font-michroma-face' });
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
});

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
    <html
      lang="en"
      className={`${inter.variable} ${interTight.variable} ${michroma.variable} ${instrumentSerif.variable}`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <FinShieldProvider>
          <AppShell>{children}</AppShell>
        </FinShieldProvider>
      </body>
    </html>
  );
}
