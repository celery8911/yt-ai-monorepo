import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Web3Provider from "@/components/Web3Provider";
import ClientProviders from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: "CyberAgent - Next Gen AI Market",
  description: "AI Agent Marketplace with Web3 wallet integration"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="cyber-grid min-h-screen">
        <Web3Provider>
          <ClientProviders>
            <div className="scanline" />
            <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden">
              <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
              <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />
              <Header />
              <main className="flex-grow container mx-auto px-4 py-8 z-10 relative">
                {children}
              </main>
              <Footer />
            </div>
          </ClientProviders>
        </Web3Provider>
      </body>
    </html>
  );
}
