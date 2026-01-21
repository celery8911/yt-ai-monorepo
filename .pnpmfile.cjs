// .pnpmfile.cjs
const fs = require("node:fs");
const path = require("node:path");

function findWorkspaceRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(dir, "pnpm-workspace.yaml")) ||
      fs.existsSync(path.join(dir, "pnpm-workspace.yml"))
    ) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

function enforceWorkspaceRoot(ctxCwd) {
  const argv = process.argv.slice(2);

  // 只检查危险命令
  const dangerousCommands = ["add", "install", "i", "remove", "rm", "update", "up"];
  if (!argv.some((arg) => dangerousCommands.includes(arg))) {
    return;
  }

  // 获取当前目录（pnpm 10+ 使用 ctxCwd 更可靠）
  const invokeCwd = ctxCwd || process.env.INIT_CWD || process.cwd();
  const rootCwd = findWorkspaceRoot(invokeCwd) || process.cwd();

  // 检查是否在子目录执行
  const isSubdir =
    path.resolve(invokeCwd) !== path.resolve(rootCwd) &&
    path.resolve(invokeCwd).startsWith(path.resolve(rootCwd) + path.sep);

  if (isSubdir) {
    const rel = path.relative(rootCwd, invokeCwd);
    throw new Error(`
🚫 Forbidden: Cannot run "pnpm ${argv.join(" ")}" in sub-package "${rel}"

Rules:
  • Always run dependency commands at workspace root
  • Use: pnpm add <dep> -F <package-name>
  • Use: pnpm install (at root)
    `.trim());
  }
}

module.exports = {
  hooks: {
    preResolution(ctx) {
      enforceWorkspaceRoot(ctx?.cwd);
    },
  },
};
