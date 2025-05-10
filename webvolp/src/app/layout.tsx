import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'VoIP App - Kamailio Web Client',
  description: 'Web client untuk server VoIP Kamailio dengan fitur panggilan suara dan video',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col bg-secondary-50">
          {children}
        </div>
      </body>
    </html>
  );
}