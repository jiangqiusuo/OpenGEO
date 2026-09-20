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
