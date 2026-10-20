# 黑夜君临 · 遗物检测站

《艾尔登法环 黑夜君临》（ELDEN RING NIGHTREIGN）三词条遗物合法性检测的纯静态网站。

- 词条查询 / 筛选
- 输入三词条 → 输出「合法 / 非法 / 顺序错误」+ 具体原因 + 正确排序
- 搭配模拟（实时互斥提示）
- URL 分享（`#` 参数复现结果）
- 本地收藏（localStorage）
- 版本 / 口径切换（普通 1.03 / 普通旧池 / 深夜正面 / 通用顺序互斥）

**非官方工具，数据仅供参考。** 纯静态、无后端、无登录、无运行时 AI 调用；部署后不联网也能完成全部查询与检测。

## 技术栈

Vite + React + TypeScript，数据打包为 JSON，Vitest 做规则引擎测试。

## 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm test         # 规则引擎测试（16 条，全部通过）
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
  data/affixes.json       # 合并数据：开源权威字段 + 你 xlsx 补充的文字；referenceOnly 为参考/已移除词条
  lib/engine.ts           # 规则引擎（移植自上游 LegalityChecker）
  lib/engine.test.ts      # 16 条测试：10 移植 + 2 数据完整性 + 4 真实数据端到端
  lib/catalog.ts          # 数据加载与索引
  lib/url.ts              # URL 分享 / 复现
  lib/storage.ts          # localStorage 收藏
  pages/                  # 检测 / 查询 / 规则说明
tools/
  xlsx2json.mjs           # 解析 xlsx → JSON
  merge-data.mjs          # 合并 xlsx 与上游 affixes.json
upstream/                 # 克隆的开源参考实现（.gitignore 排除）
```

## 数据来源与许可

- 权威合法性字段（`compatibilityId` / `sortId` / `poolIds` / `isCurse` / `requiresCurse`）来自开源项目
  [sganggs/nightreign-relic-checker](https://github.com/sganggs/nightreign-relic-checker)，
  由游戏参数（`AttachEffectParam` 等）生成，详见其 `macos/DataSources/PROVENANCE.md`。
  该数据源融合了 MIT（Save Editor / Smithbox）与 GPL-3.0（NightreignQuickRef）内容。
- 词条「效果说明 / 备注」等展示文字来自你提供的 `遗物与武器词条汇总.xlsx`。
- 游戏 FMG 文本版权归 FromSoftware / Bandai Namco 所有。本项目与官方无任何关联。

## 更新数据

数据文件是 `src/data/affixes.json`。更新词条数据后重新构建即可：

```bash
node tools/merge-data.mjs   # 若需重新合并（需先准备 xlsx-out/ 与 upstream/data/）
npm run build
```

## 部署

### 方式一：GitHub Pages（零成本）

仓库 Settings → Pages → Source 选 GitHub Actions，推送后自动部署。
工作流见 `.github/workflows/deploy.yml`。

### 方式二：Cloudflare Pages

- 构建命令：`npm run build`
- 输出目录：`dist`
- 无需其他配置（站点 `base: './'` 已兼容子路径与 `file://` 离线打开）。
