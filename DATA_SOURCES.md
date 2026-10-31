# 角色、Boss 与夜王模式数据（2026-10-31）

## 角色与 Boss

- 来源：[夜幕验物](https://github.com/sganggs/nightreign-relic-checker) 的 `data/nightreign-heroes-v1.03.5.json`、`data/nightreign-bosses-v1.03.5.json`。
- 游戏参数快照：v1.03.5 + DLC1，regulation 10350000，原数据生成于 2026-09-22。不是运行时游戏查询；后续补丁变化需要重新核对。
- 参数、名称来源与授权线索完整保留在生成 JSON 的 `sources` / `caveats`；输入文件 SHA-256 在 `inputSha256`。数据生成说明见上游 `macos/DataSources/PROVENANCE.md`。
- 基础角色 10 名、各 1–15 级：保留基础属性、HP / FP / 精力。不加入遗物加成，不展示未经实测且本作无负重界面的 equipLoad。1 / 2 / 12 / 15 为参数锚点，其余为上游经追踪者全级校验的插值结果。
- Boss 按实际登场角色筛选；只标成 `unplaced` 的行不展示。`noReward` **不是**废弃行标记，真实夜王阶段也可能不负责发放奖励，故不能按它过滤。
- 127 个 Boss / 夜王形态条目，包含 18 种夜王菜单形态；同一形态下可有不同阶段 / 场合参数行。无法确认用途的变体显式标记，未确认中文名时显示英文。
- `damageRates` 是 NPC 基础承伤倍率；展示的减伤率为 `(1 - rate) * 100%`，负值是弱点。异常状态阈值与伤害抗性分开，免疫读取源数据的 `immune` 字段。不是实战最终伤害计算器，额外效果加成、临时增益、部位、环境、重复异常触发和模式累积量倍率不在本页计算。

## 夜王推算

- 直接读取 [Nightfarer Ledger](https://nightfarerledger.com/nightmap) 页面公开使用的六份 JSON：`https://nightfarerledger.com/nightreign/nightmap/{earth}.json`。
- `earth`：`limveld` / `crater` / `mountaintop` / `rotted_woods` / `noklateo` / `great_hollow`。
- 原始编整：[Artimuz 的 Seed Finder](https://nightreign-seed-finder.com/faq)，基于 [thefifthmatt 解包目录](https://thefifthmatt.github.io/nightreign/) 以及 kevins78 的 DLC 资料。
- 资料标注 1.03.2，镜像快照 2026-09-26，本地提取于 2026-10-31。提取的是 ID、地形、两夜主 Boss 与夜王这五项事实，不复制网页代码、图片或地图绘制素材。
- 520 条唯一记录：基础 000–319 共 320，DLC 1000–1199 共 200；地形数量为 240 / 50 / 50 / 50 / 50 / 80。
- 同名社区别名在 `aliases` 中显式归一化，不把第一夜候选池与第二夜候选池简单取交集。两个已知 Boss 必须出现在同一条真实记录才算匹配。
- 基础 320 条两夜配对与独立公开项目 [shahf215/Nightreign-Overlay](https://github.com/shahf215/Nightreign-Overlay) 的 `public/assets/data/patterns_by_nightlord/*.json` 逐条对照：320 / 320 一致。DLC 200 条来自上述带作者署名的公开模式记录，不能声称已经独立逐条实机验证。
- 匹配条数是记录数量，不是抽选概率。无法由地图模式判定普通 / 永夜形态；无匹配表示该资料范围未收录，不断言游戏中绝不可能出现。

## 更新与核对

`tools/prepare-compendium.mjs` 从同版本上游参数 JSON 及本地研究目录 `tools/shots/records-*.json` 提取最小展示数据，输出 `src/data/heroes.json`、`bosses.json`、`night-patterns.json`。原始研究下载与截图保持本地，不打包到站点。

角色图现按用户反馈改为八维雷达图：每项属性的径向距离线性对应数值，所有角色使用固定 0–80 刻度；八个轴旁直接标值，配套同刻度的属性条。雷达图面积不代表综合战力，HP / FP / 精力仍独立展示。点击属性条可定位图中对应顶点。

`src/lib/compendium.test.ts` 验证角色等级覆盖、派生公式、真实夜王行保留、减伤正负方向、520 条记录完整性、同记录筛选、版本路由兼容性。浏览器验证包括三页操作、手机无横向溢出与离线可用。

## 发布前复核

用户已于 2026-10-31 授权本次发布。`tools/audit-compendium.mjs` 重新读取上游固定提交的两份参数快照及六份公开地图数据，逐字段检查：角色 1,650 项数值、229 个 Boss 变体的 1,832 项承伤倍率与 1,603 项异常阈值、520 条配对均一致；基础 320 条与另一公开项目记录一致。数值与参数源一致不等于逐项实机测试，DLC 200 条也不冒称独立实机验证。

结果与固定源链接见 `DATA_VERIFICATION.json`。原始参数文件在本地与远端 JSON 语义完全一致，文件哈希可能因 LF / CRLF 换行不同而不同。复核脚本只读取与校验数据，不执行上传。
