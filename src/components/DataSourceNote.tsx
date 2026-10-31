import { gameDataVersion } from '../lib/compendium';
export function DataSourceNote({patterns=false}:{patterns?:boolean}) {
  return <details className="data-source"><summary>版本、来源与数值口径 · {patterns?'模式 1.03.2':gameDataVersion}</summary>{patterns ? <>
    <p>地图模式资料：1.03.2；原始快照 2026-09-26，本站检索 2026-10-31。共 520 条（基础 320 / DLC 200），按真实两夜配对筛选；这是资料范围内的候选，不是游戏服务器的实时结果。</p>
    <p>资料整理：Artimuz、thefifthmatt、kevins78。来源：<a href="https://nightfarerledger.com/nightmap" target="_blank" rel="noreferrer">Nightfarer Ledger 公开模式记录</a>、<a href="https://nightreign-seed-finder.com/faq" target="_blank" rel="noreferrer">Seed Finder 数据说明</a>、<a href="https://thefifthmatt.github.io/nightreign/" target="_blank" rel="noreferrer">原始地图解包研究</a>。守夜组合中文为查找用的社区称呼，保留英文以便对照。</p>
  </> : <>
    <p>参数版本：{gameDataVersion} · regulation 10350000；本站检索核对 2026-10-31。来源：<a href="https://github.com/sganggs/nightreign-relic-checker" target="_blank" rel="noreferrer">夜幕验物公开数据与 PROVENANCE</a>（HeroStatusParam / NpcParam / 常驻 SpEffect，简中 FMG 名称）。此为有版本标注的参数快照，不承诺覆盖后续补丁。</p>
    <p>角色不含遗物、装备与临时增益。1、2、12、15 级为参数锚点，其余等级按上游已验证的基础属性插值规则计算。Boss 展示对应变体的 NPC 基础承伤倍率；效果加成、部位、临时增益、环境和战斗动态效果可能进一步改变实战伤害。</p>
  </>}</details>;
}
