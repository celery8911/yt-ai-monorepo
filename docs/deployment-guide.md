# 前后端部署踩坑指南

本文档记录了 yt-ai-monorepo 项目部署过程中遇到的问题和解决方案。

## 项目结构

```
yt-ai-monorepo/
├── apps/
│   ├── front-end/     # Next.js 16 前端应用
│   └── back-end/      # NestJS 后端应用
├── packages/          # 共享包 (@yt/ui, @yt/hooks, @yt/libs)
├── pnpm-lock.yaml
└── vercel.json
```

---

## 一、前端部署 (Vercel)

### 1.1 Monorepo + pnpm 配置问题

**问题**：Vercel 默认使用 npm install，导致安装失败。

**报错**：
```
Error: Command "npm install" exited with 1
```

**解决方案**：在 `vercel.json` 中指定使用 pnpm：

```json
{
  "installCommand": "npx pnpm install --no-frozen-lockfile",
  "buildCommand": "npx pnpm --filter @yt/front-end build"
}
```

### 1.2 pnpm 版本问题

**问题**：项目指定了 `"packageManager": "pnpm@10.28.0"`，Vercel 默认的 pnpm 版本不匹配。

**尝试过的方案**：
- `npm i -g pnpm` → 失败（Vercel 不允许全局安装）
- `corepack enable && pnpm install` → 失败（corepack 未正确启用）

**最终方案**：使用 `npx pnpm` 临时安装运行：
```json
{
  "installCommand": "npx pnpm install --no-frozen-lockfile"
}
```

### 1.3 Lockfile 校验失败

**报错**：
```
ERR_PNPM_LOCKFILE_CONFIG_MISMATCH  Cannot proceed with the frozen installation.
The current "pnpmfileChecksum" configuration doesn't match the value found in the lockfile
```

**解决方案**：添加 `--no-frozen-lockfile` 参数跳过校验：
```json
{
  "installCommand": "npx pnpm install --no-frozen-lockfile"
}
```

### 1.4 Next.js useSearchParams 预渲染失败

**报错**：
```
Error occurred prerendering page "/create"
Export encountered an error on /create/page: /create, exiting the build.
```

**原因**：使用了 `useSearchParams()` 的页面在构建时静态预渲染会失败，因为构建时没有 URL 查询参数。

**错误尝试**：在 `"use client"` 组件中添加 `export const dynamic = "force-dynamic"` → 不生效（只对服务端组件有效）

**正确方案**：使用 Suspense 包裹

```tsx
// page.tsx (服务端组件)
import { Suspense } from "react";
import CreateAgentForm from "./CreateAgentForm";

export default function CreatePage() {
  return (
    <Suspense fallback={<div>加载中...</div>}>
      <CreateAgentForm />
    </Suspense>
  );
}
```

```tsx
// CreateAgentForm.tsx (客户端组件)
"use client";
import { useSearchParams } from "next/navigation";

const CreateAgentForm = () => {
  const searchParams = useSearchParams();
  // ...
};
```

### 1.5 最终 vercel.json 配置

```json
{
  "buildCommand": "npx pnpm --filter @yt/front-end build",
  "outputDirectory": "apps/front-end/.next",
  "installCommand": "npx pnpm install --no-frozen-lockfile",
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

### 1.6 区域配置

| 区域 | 代码 | 备注 |
|------|------|------|
| 东京 | `hnd1` | 亚太推荐 |
| 新加坡 | `sin1` | |
| 香港 | `hkg1` | |
| 美国东部 | `iad1` | 默认 |

**注意**：免费版 (Hobby) 只能使用默认区域，需要 Pro 版本才能自定义。

---

## 二、域名配置 (Cloudflare + Vercel)

### 2.1 配置方式

保持 Cloudflare 作为 DNS 管理，指向 Vercel 托管。

**DNS 记录配置**：

| 类型 | 名称 | 内容 | 代理状态 |
|------|------|------|----------|
| A | `@` | `76.76.21.21` | DNS only (灰色云) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only (灰色云) |

### 2.2 常见问题

**问题**：根域名 `@` 无法添加 CNAME

**原因**：DNS 规范限制，CNAME 不能和其他记录共存。

**解决**：使用 A 记录指向 Vercel IP `76.76.21.21`

**问题**：提示 "CNAME record with that host already exists"

**解决**：先删除已存在的同名记录，再添加新记录。

### 2.3 注意事项

- 代理状态选择 **DNS only（灰色云朵）**
- 不要开启橙色云朵代理，否则 SSL 证书会冲突
- 如果要用 Cloudflare CDN，需要将 SSL 设置为 Full (Strict)

---

## 三、后端部署 (Serverless Framework)

### 3.1 网络问题

**报错**：
```
Unable to reach the Serverless API (fetch failed)
Client network socket disconnected before secure TLS connection was established
code: ECONNRESET
```

**原因**：网络连接问题，常见于中国大陆访问。

**解决方案**：
- 配置代理：`set HTTPS_PROXY=http://127.0.0.1:7890`
- 或使用稳定的网络环境
- 检查 https://status.serverless.com 服务状态

### 3.2 AWS 权限需求

SST 部署 Next.js 需要的 AWS 权限：

| 服务 | 用途 | 必须 |
|------|------|------|
| CloudFront | CDN 分发 | ✅ |
| Lambda | SSR 渲染 | ✅ |
| S3 | 静态资源存储 | ✅ |
| IAM | 创建执行角色 | ✅ |
| Route53 | 自定义域名 | ❌ 可选 |

---

## 四、部署方案对比

### 前端部署选项

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Vercel** | 零配置、Next.js 官方支持 | 流量大时费用高 | 快速上线 |
| **SST** | AWS 原生、成本可控 | 需要 CloudFront 等权限 | AWS 生态 |
| **Cloudflare Pages** | 边缘部署、免费额度大 | Next.js 支持有限 | 静态为主 |
| **Docker** | 完全可控 | 配置复杂 | 自建服务器 |

### 仓库不在自己账号下的部署方式

如果无法连接 GitHub 到托管平台：

1. **Vercel CLI 本地部署**（推荐）
   ```bash
   npm i -g vercel
   vercel --prod
   ```

2. **SST/Serverless 本地部署**
   ```bash
   aws configure  # 配置 AWS 凭证
   pnpm deploy:dev
   ```

---

## 五、关键经验总结

1. **Monorepo 项目必须配置 installCommand 和 buildCommand**
2. **pnpm 项目在 Vercel 上用 `npx pnpm` 而非全局安装**
3. **useSearchParams 必须用 Suspense 包裹，不能依赖 dynamic export**
4. **Cloudflare + Vercel 配合时，关闭 Cloudflare 代理（灰色云朵）**
5. **根域名用 A 记录，子域名用 CNAME 记录**
6. **遇到网络问题先检查代理和 VPN 设置**

---

## 六、常用命令

```bash
# Vercel 部署
vercel --prod

# 添加域名
vercel domains add example.com

# SST 部署
pnpm deploy:dev

# 检查 DNS 解析
nslookup example.com
```
