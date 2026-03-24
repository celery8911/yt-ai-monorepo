# Monorepo 依赖操作红线表

| 红线 | 禁止行为 | 正确做法 | 目的 |
| --- | --- | --- | --- |
| R1 | 在子包目录执行 `pnpm install/add/remove/update` | 在根目录执行 `pnpm install -w` 或 `pnpm add <dep> -F <pkg>` | 保护 `pnpm-lock.yaml` 与工作区一致性 |
| R2 | 在子包目录修改依赖版本但不更新锁文件 | 在根目录统一执行依赖变更并提交锁文件 | 避免锁文件漂移和 CI 行为不一致 |
| R3 | 在子包里直接 `npm/yarn` 操作依赖 | 统一使用 `pnpm` 并在根目录操作 | 避免不同包管理器生成冲突文件 |
| R4 | 在子包里临时安装依赖用于调试 | 用 `pnpm add -F <pkg> -D` 添加到对应包或用临时脚本 | 避免隐式依赖和本地环境污染 |
| R5 | 在子包中手动改 `node_modules` | 通过 `pnpm` 变更依赖并重新安装 | 避免不可追踪的依赖状态 |


## 依赖操作原则

- 禁止在子包目录执行 `pnpm install/add/remove/update`，所有依赖操作必须在仓库根目录完成
- 添加依赖统一用 `pnpm add <dep> -F <pkg>`，需要开发依赖请加 `-D`
- 禁止使用 `npm` 或 `yarn` 操作依赖，避免生成冲突的锁文件
- 统一使用仓库指定的 pnpm 版本（参见 README 中的 Corepack 步骤），避免锁文件格式不一致
- `pnpm-lock.yaml` 为全局锁文件，改动必须可追溯且与提交保持一致

## 代码提交流程与红线 (AI Agent Rules)
- **禁止采用任何借口绕过代码检查**：任何情况下都不允许使用 `git commit --no-verify`。
- **强制要求完美提交**：在提交（Commit）前，必须通过 `pnpm format` 和 `pnpm check --write` 以及手动分析，彻底修复所有 Biome 报错和 Linter 警告，保证提交的 Typescript 处于干净且类型安全的状态。
