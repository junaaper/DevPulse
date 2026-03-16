import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevPulse — GitHub Activity Leaderboard",
  description:
    "Rank developers by their GitHub contribution activity over the last 30 days",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <nav className="border-b border-border">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/" className="text-lg font-bold tracking-tight">
              <span className="text-emerald-400">Dev</span>Pulse
            </a>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="/" className="hover:text-foreground transition-colors">
                Leaderboard
              </a>
              <a
                href="/docs"
                className="hover:text-foreground transition-colors"
              >
                API Docs
              </a>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
