import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'GCIT Football | Ground Booking',
  description: 'Book your football ground in seconds with GCIT Football. Real-time availability, professional referees, and player ratings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="antialiased font-sans bg-[#050505] text-[#E5E7EB]" suppressHydrationWarning>
        <div className="flex flex-col lg:flex-row min-h-screen">
          <div className="lg:w-64 shrink-0">
            {/* Navbar is fixed/absolute in lg, so we just need this spacer or relative positioning */}
          </div>
          <div className="flex-1 min-w-0">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
