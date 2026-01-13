"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatAddress } from "@yt/libs";
import { useWallet } from "@yt/hooks";
import { Button } from "@yt/ui";

const navItems = [
  { label: "智能体", path: "/market" },
  { label: "任务", path: "/jobs" },
  { label: "钱包", path: "/wallet" },
  { label: "控制台", path: "/dashboard" },
  { label: "账单", path: "/billing" },
  { label: "DAO", path: "/dao" }
];

const Header = () => {
  const pathname = usePathname();
  const { address, isConnected, connect, disconnect, isConnecting } = useWallet();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="size-8 bg-blue-600 rounded-lg flex items-center justify-center neon-glow group-hover:scale-110 transition-transform">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tighter neon-text uppercase">
            CyberAgent
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`text-xs font-bold transition-colors hover:text-blue-400 ${
                pathname.startsWith(item.path) ? "text-blue-400" : "text-slate-400"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            className="hidden sm:flex size-9 rounded-full border border-white/10 bg-slate-900/40 items-center justify-center hover:border-blue-500/50 transition-all"
            aria-label="通知"
          >
            <svg
              className="w-4 h-4 text-slate-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 01-6 0m6 0H9"
              />
            </svg>
          </button>
          <Link href="/profile" className="hidden sm:flex items-center gap-2 group">
            <div className="size-8 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center group-hover:border-blue-500/50 transition-all overflow-hidden">
              <img
                src="https://api.dicebear.com/7.x/pixel-art/svg?seed=0x4f"
                alt="User"
              />
            </div>
          </Link>
          {isConnected && address ? (
            <div className="flex items-center gap-2">
              <Button className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 px-6">
                {formatAddress(address)}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  void disconnect();
                }}
              >
                断开
              </Button>
            </div>
          ) : (
            <Button
              className="bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 px-6"
              onClick={() => {
                void connect().catch(() => {});
              }}
              disabled={isConnecting}
            >
              {isConnecting ? "连接中..." : "连接钱包"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
