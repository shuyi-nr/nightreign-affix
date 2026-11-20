# 角色、Boss 与夜王模式数据（2026-10-31）

## 角色技能说明与关联遗物（2026-11-20）

### 本次扩充与独立参数复核

`src/data/hero-mechanics.json` 新增全部 30 项技能的机制分解、基础冷却、14 类混合魔法与九类道具经验阈值。命中行分开记录攻击分量、基础削韧和冲击等级，不把参数分量当最终扣血；有技能武器时显示等级成长后的基础分量，未计属性补正、敌方防御和临时增益。兽形与混合魔法的固定攻击行保持原始分量，不伪造完整结算。未确认的重演精确窗口、共感术比例和召唤家人各招式完整伤害明确留空或注明范围，不根据未命名字段猜测。

首领资料现为 **150 类 / 278 个变体**，比旧版增加 23 类 / 49 个变体。`src/data/resource-bosses.json` 提取 30 类 / 50 个资源点配置（一行已存在于旧表），包含营地、堡垒、城堡、遗迹、大教堂、地下要塞和火山口。按英文参数行名的明确地点标记归类；伴随狼、集群成员和普通守卫另行标注，不冒充全部都是独立首领。所用参数行名中带资源点以及 Boss / Elite / healthbar 标记的 46 行已全部收录；这项覆盖检查仅针对有明确标记的行，不等于已经逆向全部地图抽选脚本。

来源是站长本机安装的 `regulation.bin`，容器版本 `10350000`，SHA-256 为 `876a3ca279a4561d0c69f81fe5e510c75c59ab9a8a201694f8cf4a42c91e0268`。定义和英文行名采用 [Smithbox 固定提交](https://github.com/vawser/Smithbox/tree/f5969c060cea240476e9dd4d6a64eafa9dbafaab/src/Smithbox.Data/Assets/PARAM/NR)；仅提取事实字段，不打包完整游戏文件。中文有游戏原名时采用原名，没有统一简中菜单名的类别使用中文描述，不宣称自行描述都是官方译名。英文标识保留用于内部查找与参数溯源，页面普通文案、首领与事件说明改为中文；作者名、版权和参数字段保留原标识。

2026-11-20 重新查阅[官方更新目录](https://nightreign.eldenring.jp/news.html)：最近的 [PlayStation 1.03.4 更新](https://nightreign.eldenring.jp/article/260918_1.html)与 [PC 1.03.3 更新](https://nightreign.eldenring.jp/article/260702_1.html)仍均列 Regulation 1.03.5。软件版本与参数版本分开记录，不把软件安全更新误判为抗性数值已经变更。

本次复核记录在 `COMBAT_DATA_VERIFICATION.json`：2,224 个伤害倍率、1,946 个异常阈值及对应免疫标记、126 个机制字段和 756 个命中／成长字段与原始参数一致，无差异。数值来源一致不代表所有动态交互已经实机验证，抗性仍是对应敌人参数的基础值。

准备已解码 JSON 后，依次运行 `node tools/prepare-resource-bosses.mjs`、`node tools/prepare-compendium.mjs`、`node tools/prepare-hero-mechanics.mjs`、`node tools/audit-combat-data.mjs`。解码输入保留在忽略目录 `tools/shots/hero-details/`；生成器逐字段断言，缺少输入会失败，不自动用网络攻略补数。历史 `DATA_VERIFICATION.json` 保留 2026-10-31 核查范围，不覆盖历史记录。

`src/data/hero-abilities.json` 覆盖 10 名角色的 30 项技能，以及 66 条专属和 13 条通用词条。基础技能描述分别根据 Bandai Namco 官方角色页整理，名称与说明均为中文。中文名称对照 BWIKI 收录的游戏菜单原文「三语:所有菜单文本」及其 dlc01 增量，仅取名称，不引用其社区机制分析。追踪者保命恢复条件、铁之眼被动对队友生效、无赖墓碑支援作用另对照官方玩法指南。每个角色在页面保留对应官方链接。

遗物效果按现有 `affixes.json` 的 effectId 和游戏简中名称关联；按「能力」「技艺」「绝招」及触发条件人工归类。隐士的收集属性痕同时涉及被动恢复和技艺，因此允许同一效果在两个相关技能下出现；连击、背刺、属性转换等其余专属词条收在同页折叠区。通用冷却 / 量表词条单列，避免遗漏负面效果。

额外数值仅取固定上游 `6fe8267682149568058649b5f25a1481ac06384e` 的 `nightreign-buffs-v1.03.5.json`。数据生成器会检查每条说明关联的 SpEffect 是否确实归属于该遗物，并逐字段断言数值与持续时间。女爵再演只引用 `restageAttackRate`，不据此推断异常累积、多人覆盖或多条叠加。无法确认详细数值的条目只展示游戏词条原文。属性变化取同修订 heroes 数据的 1 / 12 级参数锚点，不用有取整歧义的中间等级推算。

生成命令为 `node tools/prepare-hero-abilities.mjs`，只打包小型展示数据，保留输入 SHA-256 和字段依据。与角色技能有关的通用物理 / 属性增伤是否作用于具体命中段仍需攻击数据及实测支持，此次不做逐段增伤计算。页面原有雷达仍显示基础属性。

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
