import type { ReactNode } from 'react';
import Link from 'next/link';
import './globals.css';

export const metadata = { title: 'VCL Files', description: 'Knowledge base' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <Link href="/">Home</Link>
          <Link href="/sync">Sync</Link>
          <Link href="/review">Review</Link>
          <Link href="/query">Query</Link>
          <Link href="/clients">Clients</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/setup">Setup</Link>
        </nav>
        <main className="main">{children}</main>
      </body>
    </html>
  );
}
