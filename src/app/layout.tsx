import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GlobalParticles from "@/components/GlobalParticles";
import CalWrapper from "@/components/cal/CalWrapper";
import ExitIntentModal from "@/components/ExitIntentModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Inerci | AI Automatizacijos",
  description: "Kuriame aukštos kokybės AI sprendimus, kurie padeda verslams veikti efektyviau.",
  openGraph: {
    title: "Inerci | AI Automatizacijos",
    description: "Kuriame aukštos kokybės AI sprendimus, kurie padeda verslams veikti efektyviau.",
    siteName: "Inerci",
  },
  twitter: {
    title: "Inerci | AI Automatizacijos",
    description: "Kuriame aukštos kokybės AI sprendimus, kurie padeda verslams veikti efektyviau.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="lt" className="bg-background">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background`}
      >
        {/*
          Layering strategy:
          1. Body has the dark background
          2. Particles layer: fixed, z-index: 1, pointer-events: none (above body bg)
          3. Content wrapper: relative, z-index: 2 (above particles, transparent bg)

          Particles render on top of body background but behind all content.
          Content has transparent background so particles show through gaps.
        */}

        {/* Global particles background - fixed at z-index: 1 */}
        <GlobalParticles />

        {/* Cal.com booking modal provider */}
        <CalWrapper>
          {/* Main content wrapper - sits above particles at z-index: 2 */}
          <div className="relative" style={{ zIndex: 2 }}>
            {children}
          </div>

          {/* Exit-intent modal - shows consultation offer when user tries to leave */}
          {/* To disable: remove this line or set enabled={false} */}
          <ExitIntentModal />
        </CalWrapper>
      </body>
    </html>
  );
}
