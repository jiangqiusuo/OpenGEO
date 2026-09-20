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
