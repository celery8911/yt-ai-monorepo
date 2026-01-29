const fs = require("fs");
const path = require("path");

const rootNodeModules = path.resolve(__dirname, "../../../node_modules");
const localNodeModules = path.resolve(__dirname, "../node_modules");

// 需要复制的模块列表
const modulesToCopy = [".prisma", "@prisma/client", "bull", "ioredis"];

function copyDirSync(src, dest) {
	if (!fs.existsSync(src)) {
		console.log(`  Skipped (not found): ${src}`);
		return false;
	}

	fs.mkdirSync(dest, { recursive: true });

	const entries = fs.readdirSync(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		// 跳过 Windows/macOS 引擎文件
		if (entry.name.includes("windows") || entry.name.includes("darwin")) {
			continue;
		}

		if (entry.isDirectory()) {
			copyDirSync(srcPath, destPath);
		} else {
			fs.copyFileSync(srcPath, destPath);
		}
	}
	return true;
}

console.log("Copying modules for Lambda deployment...\n");

for (const mod of modulesToCopy) {
	const src = path.join(rootNodeModules, mod);
	const dest = path.join(localNodeModules, mod);

	console.log(`Copying ${mod}...`);

	// 清理旧文件
	if (fs.existsSync(dest)) {
		fs.rmSync(dest, { recursive: true });
	}

	// 复制新文件
	if (copyDirSync(src, dest)) {
		console.log(`  Done: ${mod}`);
	}
}

console.log("\nAll modules copied successfully!");
