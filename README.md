# 黑夜君临 · 遗物检测站

《艾尔登法环 黑夜君临》（ELDEN RING NIGHTREIGN）三词条遗物合法性检测的纯静态网站。

- 词条查询 / 筛选
- 输入三词条 → 输出「合法 / 非法 / 顺序错误」+ 具体原因 + 正确排序
- 搭配模拟（实时互斥提示）
- URL 分享（`#` 参数复现结果）
- 本地收藏（localStorage）
- 版本 / 口径切换（普通 1.03 / 普通旧池 / 深夜正面 / 通用顺序互斥）
- 深夜完整（三词条）检测：96 种常规可抽遗物类型，正负逐行配对，排序保留配对关系；未命名测试记录不纳入检测
- 手机全屏选择、最近使用、冲突槽位高亮和一键排序
- 收藏命名 / 改名 / 导出导入，公开问题反馈入口与更新记录
- 页脚公开浏览量（不蒜子，第三方联网服务）
- 角色数值：10 位角色的 1–15 级八维雷达图、数值与属性条，支持点击顶点定位
- Boss 抗性：127 个条目 / 229 个阶段及场合变体，基础伤害减伤率与异常累积阈值分开展示
- 随机夜王推算：520 条真实模式记录，按两夜 Boss 配对、地形、基础 / DLC 范围筛选候选并显示证据

2026-11-02 更新：`#/world` 收录 15 类事件 / 遭遇，以及四种特殊地形；`#/hollow` 独立整理 21 个共鸣结晶候选点、分布组、地下筛选与两座要塞强敌。七张站长提供的游戏截图已清理蓝色角色图标并叠加点位，火山 / 大空洞支持分层。全部入口整理为四组，更新记录统一折叠并按日期查看，后续维护 `src/data/updates.ts`。资料与权利说明见 [EXPLORATION_SOURCES.md](EXPLORATION_SOURCES.md)，图片处理记录见 [MAP_ASSETS.md](MAP_ASSETS.md)。

**非官方工具，数据仅供参考。** 纯静态、无后端、无登录、无运行时 AI 调用；部署后不联网也能完成全部查询与检测。

## 技术栈

Vite + React + TypeScript，数据打包为 JSON，Vitest 做规则引擎测试。

## 本地运行

```bash
npm install
npm run dev      # 开发服务器
npm test         # 规则、配对、分享、收藏、筛选等测试
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

角色、Boss 与模式数据的版本、提取方式和适用范围见 [DATA_SOURCES.md](DATA_SOURCES.md)。本次发布前逐字段复核报告见 [DATA_VERIFICATION.json](DATA_VERIFICATION.json)。角色 / Boss 参数为 v1.03.5 + DLC1；模式资料为 1.03.2，不代表实时游戏状态。

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

深夜遗物类型来自同版本 `nightreign-relics-v1.03.4.json`，可用 `node tools/merge-deep-data.mjs` 重新提取。完整检测按上游 `RelicAudit.swift` 的逐行模型验证：正面在深夜池并集、负面在诅咒池，重复 / 互斥覆盖正负全部词条；只按正面排序，负面随整行移动。保留原七模板正面预检，两种口径在界面明确区分。本工具不读取存档。

## 公开浏览量与反馈

`VisitCounter.tsx` 自 2026-10-31 切换到 [xcsoft 不蒜子公共服务](https://busuanzi.meuicat.com/) 的 JSON POST API，重新累计页面 PV；旧服务证书失效，历史未合并。固定发送站点根路径作为 `x-bsz-referer`，不发送 hash、词条组合、收藏、Cookie 或身份令牌。正式域名每次打开 / 刷新一个请求，站内切换与 StrictMode 不重复计数；手动重试可能增加一次计数。local / file 预览不计数。新服务缓存使用独立键，失败可显示带时间的历史快照并明确标注非实时，不伪造新数字。服务方仍能收到 IP 与浏览器信息；这不是 UV 或完整分析后台。可用性和计数连续性依赖第三方。`node tools/verify-update.mjs --candidate` 可在正式源的模拟页面中验证本地构建与真实服务的跨域兼容性。

问题反馈跳转仓库 GitHub Issues，由用户自行提交，自动带入当前复现链接、口径及数据版本；提供复制模板选项。提交公开且需 GitHub 登录。

浏览器回归验证：`node tools/verify-update.mjs`（Windows Chrome，需要先构建）；上线后 `node tools/verify-update.mjs --live` 验证真实公开计数。

## 部署

### 方式一：GitHub Pages（零成本）

仓库 Settings → Pages → Source 选 GitHub Actions，推送后自动部署。
工作流见 `.github/workflows/deploy.yml`。

### 方式二：Cloudflare Pages

- 构建命令：`npm run build`
- 输出目录：`dist`
- 无需其他配置（站点 `base: './'` 已兼容子路径与 `file://` 离线打开）。
