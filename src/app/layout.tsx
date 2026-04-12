import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Scrum Poker — Real-time Planning Poker for Agile Teams",
    template: "%s — Scrum Poker",
  },
  description:
    "Free real-time planning poker for agile teams. Estimate with Fibonacci or T-Shirt sizing, share a room link, and vote together — no sign-up required.",
  keywords: [
    "scrum poker",
    "planning poker",
    "agile estimation",
    "story points",
    "fibonacci",
    "t-shirt sizing",
    "sprint planning",
    "real-time voting",
  ],
  applicationName: "Scrum Poker",
  openGraph: {
    title: "Scrum Poker — Real-time Planning Poker for Agile Teams",
    description:
      "Free real-time planning poker for agile teams. Estimate with Fibonacci or T-Shirt sizing — no sign-up required.",
    type: "website",
    locale: "en_US",
    siteName: "Scrum Poker",
  },
  twitter: {
    card: "summary",
    title: "Scrum Poker — Real-time Planning Poker",
    description:
      "Free real-time planning poker for agile teams. No sign-up required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <div className="bg-ambient" />
          <div className="bg-noise" />
          <div className="relative z-10 flex-1 flex flex-col">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
