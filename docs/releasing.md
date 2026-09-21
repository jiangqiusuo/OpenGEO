# Community 包发布准备

当前 Community 包只完成发布元数据和本地 dry-run，不会自动上传到 npm。

## 包边界

| 包 | npm 名称 | 当前版本 | 入口 |
|---|---|---|---|
| TypeScript Client | `@opengeo/client` | `0.1.0` | `dist/index.js`、`dist/index.d.ts` |
| CLI | `@opengeo/cli` | `0.1.0` | `opengeo` → `dist/bin.js` |

根目录的 `CHANGELOG.md` 是版本记录真源；包的版本必须与根目录版本一致。包内只包含构建产物、包 README 和自动包含的许可证文件，不包含源码目录、测试、环境文件或本地依赖。

## 本地 dry-run

```bash
pnpm install --frozen-lockfile
pnpm release:check
```

该命令会先构建根项目和两个包，然后使用 `pnpm pack --dry-run --json` 检查每个包的文件清单、版本、入口和 changelog。它不会创建可发布的长期文件，也不会连接 npm 或上传包。

真正发布前还需要单独确认 npm 组织、维护者、双因素认证、包名占用、版本号和发布渠道。发布动作不属于当前 Goal。

## 正式发布前检查清单

### 已自动验证

- [x] 根版本、包版本和 `CHANGELOG.md` 版本一致。
- [x] Client 和 CLI 均可独立构建。
- [x] `pnpm pack --dry-run --json` 文件清单不含源码、测试、环境文件或私有路径。
- [x] 只读 registry 预检：2026-09-20 查询 `@opengeo/client` 与 `@opengeo/cli` 均返回 HTTP 404，当前没有发现已公开发布版本。

运行：

```bash
pnpm release:preflight
```

404 只代表 registry 中没有公开版本，不能证明当前账户拥有 `opengeo` scope，也不能替代登录后的权限检查。

### 必须由维护者确认

- [ ] npm 账户已加入并拥有 `opengeo` scope 的发布权限。
- [ ] 包名没有被组织内部保留，组织设置和包访问级别已确认。
- [ ] 维护者账户启用 2FA；发布策略符合 npm 账户的 `auth-and-writes` 要求。
- [ ] 发布使用短期、最小权限的 automation token 或受保护的 GitHub Actions Secret，不写入仓库和本地文档。
- [ ] 版本 `0.1.0`、变更日志和 Git tag 已完成最终审核。
- [ ] 先发布到受控的 `next`/预发布通道或确认直接发布 stable 的范围，再执行正式发布。
- [ ] 发布后用干净环境安装两个包，运行 CLI help、Mock Quickstart 和 Client import smoke。

建议的正式流程是：维护者确认以上清单 → 创建版本 tag → 在受保护的发布环境执行 `pnpm release:check` → 使用 npm 官方发布命令和 provenance → 记录包版本与回滚方式。当前仓库没有自动发布 workflow，也不会自动创建或读取 npm 凭据。

## npm 凭据配置建议

当前优先采用 npm Trusted Publishing，让 GitHub Actions 使用 OIDC 短期身份完成发布；这样不需要把长期写入 token 放进仓库或 CI Secret。配置 Trusted Publisher 时，仓库填写 `jiangqiusuo/OpenGEO`，工作流文件名必须与仓库中实际发布工作流的文件名完全一致，并只给该工作流 `id-token: write` 权限。首次建立包的维护者确认仍需要在 npm 页面完成，发布 workflow 在包和 scope 权限确认前不会启用。

如果当前页面要求先创建 Granular Access Token，建议按以下值填写，且只为短期发布准备使用：

| 字段 | 建议值 |
|---|---|
| Token name | `opengeo-community-staged-release` |
| Description | `Short-lived staged release for OpenGEO Community packages` |
| Allowed IP ranges | 留空，除非后续固定使用明确的 CI 出口 CIDR |
| Packages and scopes permission | `Read and write (stage only)` |
| Select packages | `Only select packages and scopes`；只选择 `@opengeo` scope 或两个目标包；若页面无法选择目标 scope，不要改为 `All packages` |
| Organizations | `No access` |
| Expiration | 30 天；最长不超过 90 天，发布后立即撤销 |

`stage only` 只能把版本送入待审核阶段，不能直接让新版本上线；维护者需要使用 npm 的 staged publishing 流程审核和提升版本。不要启用绕过 2FA，也不要把 token 发到聊天、提交到仓库或写入本地文档。npm 官方说明见：[Granular access tokens](https://docs.npmjs.com/about-access-tokens/)、[创建和查看 token](https://docs.npmjs.com/creating-and-viewing-access-tokens/) 和 [Trusted Publishing](https://docs.npmjs.com/trusted-publishers/)。

如果 `@opengeo` scope 或目标包尚未出现在可选列表中，先停止创建 token，由维护者通过交互式 2FA 完成首次包权限建立，再配置 stage-only token 或 Trusted Publishing；不要为了绕过列表限制选择全部包。

## Trusted Publishing 工作流

仓库中的 `.github/workflows/npm-publish.yml` 只在手动触发或推送 `v*` 标签时运行，并使用 GitHub OIDC 将两个包提交到 npm 的 staged publishing 阶段。工作流没有 npm 写入 token；它要求 GitHub Environment `npm-release`，并只授予 `id-token: write` 与 `contents: read`。

在 npm 的每个包设置中分别添加 Trusted Publisher：GitHub Actions、用户 `jiangqiusuo`、仓库 `OpenGEO`、工作流文件名 `npm-publish.yml`、环境名 `npm-release`，只允许 `npm stage publish`。工作流成功后，维护者仍需在 npm 中用 2FA 审核 staged 版本，才会公开发布。首次配置前不要手动运行发布工作流。
