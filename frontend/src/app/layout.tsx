import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liminal FM — Virtual Radio World',
  description: 'Walk through a virtual city and discover live radio stations by entering buildings.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  );
}
