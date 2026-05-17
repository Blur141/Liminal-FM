import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Liminal FM — Virtual Radio World',
  description: 'Walk through a pixel-art city and discover live internet radio stations by exploring buildings.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Liminal FM',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a14',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">
        <div className="crt-overlay" />
        {children}
      </body>
    </html>
  );
}
