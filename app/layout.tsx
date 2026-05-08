import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cam Slade',
  description: 'Portfolio of Cam Slade — full stack developer and CS & Mathematics student at Missouri State University.',
  icons: { icon: '/logos/csportfoliowhite.png' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
