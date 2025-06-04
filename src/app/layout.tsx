
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Zenith - Basketball Analytics',
  description: 'Calculators for athleticism percentiles, NBA prospect ratings, and player statistical averages.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <div className="fixed inset-0 -z-10 overflow-hidden">
          {/* Orb 1: Red/Orange hue */}
          <div
            className="absolute rounded-full blur-[120px] opacity-40 w-[400px] h-[400px] -top-[150px] -left-[120px]"
            style={{ background: 'radial-gradient(circle, rgba(255,190,190,0.7) 0%, rgba(255,220,190,0.7) 100%)' }}
          />
          {/* Orb 2: Yellow/Green hue */}
          <div
            className="absolute rounded-full blur-[120px] opacity-40 w-[450px] h-[450px] top-[100px] -right-[180px]"
            style={{ background: 'radial-gradient(circle, rgba(220,255,190,0.7) 0%, rgba(190,255,190,0.7) 100%)' }}
          />
          {/* Orb 3: Blue/Purple hue */}
          <div
            className="absolute rounded-full blur-[120px] opacity-40 w-[350px] h-[350px] bottom-[50px] -left-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(190,220,255,0.7) 0%, rgba(220,190,255,0.7) 100%)' }}
          />
          {/* Orb 4: Pink/Magenta hue */}
          <div
            className="absolute rounded-full blur-[120px] opacity-40 w-[380px] h-[380px] -bottom-[80px] -right-[100px]"
            style={{ background: 'radial-gradient(circle, rgba(255,190,220,0.7) 0%, rgba(255,190,255,0.7) 100%)' }}
          />
        </div>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
