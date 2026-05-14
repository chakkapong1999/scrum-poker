import type { Metadata } from "next";
import { Playfair_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: "Scrum Poker — Free Real-Time Planning Poker for Agile Teams",
    template: "%s | Scrum Poker",
  },
  description: "Free online scrum poker tool for agile teams. Estimate story points in real-time with Fibonacci or T-shirt sizing. No sign-up required.",
  keywords: ["scrum poker", "planning poker", "agile estimation", "story points", "sprint planning", "fibonacci poker", "free scrum tool"],
  authors: [{ name: "Scrum Poker" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Scrum Poker",
    title: "Scrum Poker — Free Real-Time Planning Poker for Agile Teams",
    description: "Free online scrum poker tool for agile teams. Estimate story points in real-time with Fibonacci or T-shirt sizing. No sign-up required.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrum Poker — Free Real-Time Planning Poker for Agile Teams",
    description: "Free online scrum poker tool for agile teams. Estimate story points in real-time with Fibonacci or T-shirt sizing. No sign-up required.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${jakarta.variable} ${geistMono.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs before hydration to remove 'dark' for light-theme users, preventing flash */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t==='light'||(t!=='dark'&&window.matchMedia('(prefers-color-scheme: light)').matches))document.documentElement.classList.remove('dark');}catch(e){}` }} />
      </head>
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
