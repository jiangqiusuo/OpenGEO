# Community 包发布准备

当前 Community 包已完成发布元数据、本地 dry-run 和首包发布。`@sysiphus/client@0.1.0` 与 `@sysiphus/cli@0.1.0` 已公开可安装；后续版本继续通过 GitHub Actions 的 npm Trusted Publishing 进入 staged 阶段。

## 包边界

| 包 | npm 名称 | 当前版本 | 入口 |
|---|---|---|---|
| TypeScript Client | `@sysiphus/client` | `0.1.1` | `dist/index.js`、`dist/index.d.ts` |
| CLI | `@sysiphus/cli` | `0.1.1` | `opengeo` → `dist/bin.js` |

根目录的 `CHANGELOG.md` 是版本记录真源；包的版本必须与根目录版本一致。包内只包含构建产物、包 README 和自动包含的许可证文件，不包含源码目录、测试、环境文件或本地依赖。

## 本地 dry-run

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

该命令会先构建根项目和两个包，然后使用 `pnpm pack --dry-run --json` 检查每个包的文件清单、版本、入口和 changelog。它不会创建可发布的长期文件，也不会连接 npm 或上传包。

后续版本发布前仍需确认 npm 个人账号、维护者、双因素认证、版本号和发布渠道。stage-only 工作流不会直接覆盖已发布版本，也不会绕过账号安全验证。

## 正式发布前检查清单

### 已自动验证

- [x] 根版本、包版本和 `CHANGELOG.md` 版本一致。
- [x] Client 和 CLI 均可独立构建。
- [x] `pnpm pack --dry-run --json` 文件清单不含源码、测试、环境文件或私有路径。
- [x] 首包 registry 验收：`@sysiphus/client@0.1.0` 与 `@sysiphus/cli@0.1.0` 已在 npm 页面显示为 Public/Published。

运行：

```bash
pnpm release:preflight
```

registry 状态只能证明版本可见，不能替代 Trusted Publisher 的 OIDC 运行验证。

### 必须由维护者确认

- [x] npm 账户 `sysiphus` 已启用 2FA，并已通过 Windows Hello 完成 `npm login --auth-type=web`；本机 `npm whoami` 返回 `sysiphus`。
- [x] 两个包名、公开访问级别和个人账号设置已确认。
- [x] 维护者账户通过 Windows Hello 完成 npm 2FA 安全确认。
- [x] 工作流使用 GitHub OIDC；不把长期 npm 写入 Token 写入仓库、GitHub Secret 或本地文档。
- [x] 版本 `0.1.0`、变更日志和 Git tag 已完成审核。
- [x] 两个包的 `0.1.0` staged 条目已完成 staged approve 并公开发布。
- [ ] 发布后用干净环境安装两个包，运行 CLI help、Mock Quickstart 和 Client import smoke。

当前正式流程状态：两个包的 `0.1.0` 已公开发布；本次 `0.1.1` 修复版本用于修正 CLI 的独立安装依赖。每个包的 Settings 都已绑定 Trusted Publisher（`jiangqiusuo/OpenGEO`、`npm-publish.yml`、`npm-release`、stage-only）。npm 页面显示 `Pending validation`，本次 `0.1.1` 由 GitHub Actions 成功运行一次 OIDC stage publish 后可完成首次验证。仓库工作流不会读取长期 npm 凭据。

## npm 凭据配置建议

当前优先采用 npm Trusted Publishing，让 GitHub Actions 使用 OIDC 短期身份完成发布；这样不需要把长期写入 token 放进仓库或 CI Secret。配置 Trusted Publisher 时，仓库填写 `jiangqiusuo/OpenGEO`，工作流文件名必须与仓库中实际发布工作流的文件名完全一致，并只给该工作流 `id-token: write` 权限。首次建立包的维护者确认仍需要在 npm 页面完成，发布 workflow 在包和 scope 权限确认前不会启用。

### Granular Access Token 备用说明（当前流程不使用）

当前 Trusted Publishing 已配置，后续发布不需要 Granular Access Token。只有在 npm 官方 OIDC 暂不可用、并且维护者明确批准短期人工 staged 发布时，才参考以下最小权限设置：

| 字段 | 建议值 |
|---|---|
| Token name | `opengeo-community-staged-release` |
| Description | `Short-lived staged release for OpenGEO Community packages` |
| Allowed IP ranges | 留空，除非后续固定使用明确的 CI 出口 CIDR |
| Packages and scopes permission | `Read and write (stage only)` |
| Select packages | `Only select packages and scopes`；只选择 `@sysiphus` scope 或两个目标包；若页面无法选择目标 scope，不要改为 `All packages` |
| Organizations | `No access` |
| Expiration | 30 天；最长不超过 90 天，发布后立即撤销 |

`stage only` 只能把版本送入待审核阶段，不能直接让新版本上线；维护者需要使用 npm 的 staged publishing 流程审核和提升版本。不要启用绕过 2FA，也不要把 token 发到聊天、提交到仓库或写入本地文档。npm 官方说明见：[Granular access tokens](https://docs.npmjs.com/about-access-tokens/)、[创建和查看 token](https://docs.npmjs.com/creating-and-viewing-access-tokens/) 和 [Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)。

如果 `@sysiphus` scope 或目标包尚未出现在可选列表中，先停止创建 token，由维护者通过交互式 2FA 完成首次包权限建立，再配置 stage-only token 或 Trusted Publishing；不要为了绕过列表限制选择全部包。

## Trusted Publishing 工作流

仓库中的 `.github/workflows/npm-publish.yml` 只在手动触发或推送 `v*` 标签时运行，并使用 GitHub OIDC 将两个包提交到 npm 的 staged publishing 阶段。工作流没有 npm 写入 token；它要求 GitHub Environment `npm-release`，并只授予 `id-token: write` 与 `contents: read`。

在 npm 的每个包设置中分别添加 Trusted Publisher：GitHub Actions、用户 `jiangqiusuo`、仓库 `OpenGEO`、工作流文件名 `npm-publish.yml`、环境名 `npm-release`，只允许 `npm stage publish`。Trusted Publisher 首次验证需要后续版本的工作流成功运行；工作流成功后，维护者仍需在 npm 中用 2FA 审核 staged 版本，才会公开发布。

## 首包占位版本与 OIDC staged release

当前仓库包含 `.github/workflows/npm-publish.yml`，只执行 `npm stage publish`，不会执行 direct `npm publish`，也不会绕过账号安全验证。

首包的实际结果：维护者使用 npm 11.15+ 的已认证本机会话完成了占位包建立和 `0.1.0` staged approve；两个 `0.1.0` 版本现在已经公开可安装。后续版本不再依赖本机长期令牌，而是由 Trusted Publisher 负责把版本送入 staged queue。

工作流只接受 `main` 或 `v*` tag，并校验 tag 与根目录版本一致。发布前会运行 lint、typecheck、test、contract test、examples check、release check 和高危依赖审计。仓库不保存长期 npm 写入 token。
