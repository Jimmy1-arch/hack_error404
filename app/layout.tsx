import type { Metadata } from 'next';
import { DM_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
const sans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap' });
const serif = Playfair_Display({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'swap' });
export const metadata: Metadata = { title: 'DevOps Copilot — Incident response, on autopilot', description: 'An AI on-call copilot that triages alerts, finds root causes and knows when to page your team.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body className={`${sans.variable} ${serif.variable}`}>{children}</body></html>; }
