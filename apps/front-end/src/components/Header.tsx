"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatAddress, getSupportedChains } from "@yt/libs";
import { useChainId, useSwitchChain, useWallet } from "@yt/hooks";
import { Button } from "@yt/ui";
import { useEffect, useState } from "react";
import { switchOrAddChain } from "@/utils/addChainToWallet";

const navItems = [
	{ label: "智能体", path: "/market" },
	{ label: "任务", path: "/jobs" },
	{ label: "钱包", path: "/wallet" },
	{ label: "控制台", path: "/dashboard" },
	{ label: "账单", path: "/billing" },
	{ label: "DAO", path: "/dao" },
	{ label: "签名演示", path: "/signature-demo" },
];

/** 根据 chainId 获取链名称 */
function getChainLabel(chainId: number): string {
	const chain = getSupportedChains().find((c) => c.chainId === chainId);
	return chain?.name ?? `Chain ${chainId}`;
}

const Header = () => {
	const pathname = usePathname();
	const { address, isConnected, connect, disconnect, isConnecting } =
		useWallet();
	const chainId = useChainId();
	const { isPending: isSwitching } = useSwitchChain();
	const [mounted, setMounted] = useState(false);
	const [showChainMenu, setShowChainMenu] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const showWallet = mounted && isConnected && address;
	const chainLabel = getChainLabel(chainId);
	const supportedChains = getSupportedChains();

	/** 切换链，4902 时自动添加 */
	const handleSwitchChain = async (targetChainId: number) => {
		setShowChainMenu(false);
		await switchOrAddChain(targetChainId);
	};

	return (
		<header className="sticky top-0 z-50 glass border-b border-white/5">
			<div className="container mx-auto px-6 h-16 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2 group">
					<div className="size-12 rounded-lg overflow-hidden neon-glow group-hover:scale-110 transition-transform">
						<Image
							src="/images/logo.png"
							alt="CyberAgent"
							width={48}
							height={48}
						/>
					</div>
					<span className="text-2xl font-black italic neon-text uppercase text-white drop-shadow-[0_0_16px_rgba(96,165,250,0.6)]">
						CyberAgent
					</span>
				</Link>

				<nav className="hidden lg:flex items-center gap-6">
					{navItems.map((item) => (
						<Link
							key={item.path}
							href={item.path}
							className={`text-xs font-bold transition-colors hover:text-blue-400 ${
								pathname.startsWith(item.path)
									? "text-blue-400"
									: "text-slate-400"
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
					<Link
						href="/profile"
						className="hidden sm:flex items-center gap-2 group"
					>
						<div className="size-8 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center group-hover:border-blue-500/50 transition-all overflow-hidden">
							<Image
								src="https://api.dicebear.com/7.x/pixel-art/svg?seed=0x4f"
								alt="User"
								width={32}
								height={32}
							/>
						</div>
					</Link>
					{showWallet ? (
						<div className="flex items-center gap-2">
							{/* 链切换下拉菜单 */}
							<div className="relative">
								<Button
									variant="outline"
									onClick={() => setShowChainMenu(!showChainMenu)}
									disabled={isSwitching}
								>
									{isSwitching ? "切换中..." : chainLabel}
								</Button>
								{showChainMenu && (
									<div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-white/10 bg-slate-900 shadow-xl">
										{supportedChains.map((chain) => (
											<button
												key={chain.chainId}
												type="button"
												className={`w-full px-4 py-2 text-left text-sm hover:bg-slate-800 first:rounded-t-lg last:rounded-b-lg ${
													chain.chainId === chainId
														? "text-blue-400"
														: "text-slate-300"
												}`}
												onClick={() => handleSwitchChain(chain.chainId)}
											>
												<span>{chain.name}</span>
												<span className="ml-2 text-xs text-slate-500">
													{chain.type}
												</span>
											</button>
										))}
									</div>
								)}
							</div>
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
							disabled={!mounted || isConnecting}
						>
							{isConnecting && mounted ? "连接中..." : "连接钱包"}
						</Button>
					)}
				</div>
			</div>
		</header>
	);
};

export default Header;
