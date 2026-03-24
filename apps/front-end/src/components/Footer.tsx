import Link from "next/link";

const Footer = () => {
	return (
		<footer className="glass border-t border-white/5 mt-auto">
			<div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
				<div className="flex items-center gap-4">
					<Link href="/docs" className="hover:text-blue-400 transition-colors">
						Docs
					</Link>
					<Link href="/terms" className="hover:text-blue-400 transition-colors">
						Terms
					</Link>
					<Link
						href="/privacy"
						className="hover:text-blue-400 transition-colors"
					>
						Privacy
					</Link>
					<a
						href="https://github.com"
						className="hover:text-blue-400 transition-colors"
					>
						GitHub
					</a>
				</div>
				<div className="flex items-center gap-2">
					<span className="size-2 rounded-full bg-emerald-400" />
					<span>主网运行中</span>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
