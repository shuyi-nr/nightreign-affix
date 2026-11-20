// Read-only extraction from an independently decoded local regulation snapshot.
// PARAM XML: Smithbox f5969c060cea240476e9dd4d6a64eafa9dbafaab (NR).
// Full game tables stay outside the shipped site; only cited facts/hit fields are exported.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const folder = process.argv[2] ?? 'tools/shots/hero-details/';
const tables = new Map();
const row = (table, id) => {
  if (!tables.has(table)) tables.set(table, new Map(JSON.parse(fs.readFileSync(`${folder}/${table}.json`, 'utf8')).map(r => [r.ID, r])));
  const r = tables.get(table).get(id); assert.ok(r, `${table}:${id}`); return r;
};
const clean = n => Number(n.toFixed(5));
const evidence = [];
function check(table, id, field, expected) {
  const actual = row(table, id)[field];
  assert.ok(typeof actual === 'number' && Math.abs(actual - expected) < .0001, `${table}:${id}.${field}: ${actual} != ${expected}`);
  evidence.push({ table, id, field, value: clean(actual) });
}
for (const [id, field, value] of [
  [701535, 'guardStaminaMult', .2], [702000, 'itemDropRate', .3], [702001, 'itemDropRate', .3],
  [703500, 'effectEndurance', 15], [704000, 'neutralDamageCutRate', .25], [704100, 'physicsAttackRate', 1.15],
  [705000, 'effectEndurance', 15], [705010, 'effectEndurance', 15], [706000, 'changeMpPoint', -20],
  [706100, 'effectEndurance', 12.5], [706100, 'neutralDamageCutRate', 1.15],
  [707071, 'effectEndurance', 18.5], [707071, 'physicsAttackRate', 1.2], [707071, 'staminaRecoverChangeSpeed', 15],
  [707053, 'accumuVal', 5], [707055, 'accumuVal', 15], [707056, 'accumuVal', 20], [707115, 'maxHpRate', 2],
  [708000, 'physicsAttackPowerRate', .9], [708010, 'physicsAttackPowerRate', .9],
  [708020, 'neutralDamageCutRate', 1.6], [708020, 'effectEndurance', 10], [708050, 'effectEndurance', 1.5],
  [708100, 'effectEndurance', 20.1], [709050, 'physicsAttackPowerRate', 1.1],
  [709050, 'neutralDamageCutRate', .65], [709051, 'physicsAttackPowerRate', 1.1], [709300, 'effectEndurance', 4],
  [1800200, 'effectEndurance', 20], [1800300, 'effectEndurance', 30], [1800300, 'neutralDamageCutRate', .9],
  [1801400, 'effectEndurance', 8], [1801400, 'magicConsumptionRate', 0], [1801500, 'effectEndurance', 15],
  [1801200, 'effectEndurance', 3], [1801210, 'effectEndurance', 60], [1802301, 'freezeAttackPower', 29],
]) check('SpEffectParam', id, field, value);
const cutFields=['neutralDamageCutRate','slashDamageCutRate','blowDamageCutRate','thrustDamageCutRate','magicDamageCutRate','fireDamageCutRate','thunderDamageCutRate','darkDamageCutRate'];
for(const [id,rate] of [[704000,.25],[706100,1.15],[708020,1.6],[709050,.65],[1800300,.9]])
  for(const field of cutFields)check('SpEffectParam',id,field,rate);
for(const [id,ending,rate] of [[704100,'AttackRate',1.15],[704301,'AttackRate',1.5],[707071,'AttackRate',1.2],[708000,'AttackPowerRate',.9],[708010,'AttackPowerRate',.9],[709050,'AttackPowerRate',1.1],[709051,'AttackPowerRate',1.1]])
  for(const element of ['physics','magic','fire','thunder','dark'])check('SpEffectParam',id,element+ending,rate);
check('SpEffectParam',704301,'effectEndurance',10);
check('SpEffectParam',704300,'conditionHp',25);
check('SpEffectParam',707070,'effectEndurance',1.5);
check('SpEffectParam',707070,'replaceSpEffectId',707071);
check('SpEffectParam',707070,'staminaRecoverChangeSpeed',15);
for(const field of ['artsConsumptionRate','magicConsumptionRate','miracleConsumptionRate','shamanConsumptionRate'])check('SpEffectParam',1801400,field,0);
const pc = JSON.parse(fs.readFileSync(`${folder}/PlayerCommonParam.json`, 'utf8'))[0];
for (const [field, expected] of [['tranceDuration',8],['tranceEnhanceDuration',15],['analyseProgressTrigger_Level2',50],['analyseProgressTrigger_Level3',100],['necromancyTriggerRate',35]]) check('PlayerCommonParam',pc.ID,field,expected);
const text = {
  wylder: {
    passive: [
      ['触发与重置', '可用时抵消一次致命攻击；触发后本次机会耗尽。在赐福休息或倒地后被救起可以恢复，精力条下的角色图标可用来确认是否仍有机会。'],
      ['使用边界', '这是一次保命判定，不是持续无敌。连续伤害仍可能在触发后命中，不应把它当成能承受整段连招的护盾。'],
    ],
    skill: [
      ['牵引方式', '钩中轻型敌人时将其拉近；面对大型敌人或适合的目标时，自己借钩爪接近。可利用接近动量接跳跃攻击。'],
      ['命中段', '出钩与回拉是不同攻击参数；接近后的武器攻击还要看实际使用的武器。专属遗物追加大剑攻击时，不能把钩爪的攻击参数当成大剑的面板。'],
    ],
    art: [
      ['轻按与蓄力', '轻按快速引爆铁桩；按住蓄力会提高爆炸段的攻击倍率和削韧。可以在空中使用，空中攻击另有参数。'],
      ['伤害组成', '基础虚拟武器同时有物理和火攻击力；下表分别列出两类攻击分量。蓄力与轻按的冲击等级同为 10，但削韧分别是 150 与 75，不能把冲击等级当成削韧。'],
      ['救援', '爆炸段带救援判定，救援倍率参数为 225%。实际是否一次救起仍取决于濒死量表及命中情况。'],
    ],
  },
  guardian: {
    passive: [
      ['进入姿态', '持盾防御时可进一步进入强化防御，扩大正面防护。普通格挡切换至强化防御存在动作空隙，敌人连击中切换仍有被击中的风险。'],
      ['精力开销', '强化防御效果的格挡精力消耗倍率为 0.2；这指格挡消耗的修正，不等于盾牌自身防御强度直接增加 80 点。精力耗尽仍会破防。'],
    ],
    skill: [
      ['蓄力与控制', '旋风攻击周围敌人，轻型敌人可被卷起。可以蓄力；部分飞行道具也能被旋风挡开，不只对近身敌人有效。'],
      ['延长旋风遗物', '遗物产生的延长段使用独立、较低的攻击参数。不能把初始旋风的伤害直接乘以延长段次数。'],
    ],
    art: [
      ['俯冲与保护', '起飞后选定位置俯冲，落地攻击后可维持保护姿态，为范围内队友提供防护。起飞、俯冲及落地有独立攻击行，不能把所有替代行一律相加。'],
      ['救援用途', '俯冲和落地攻击具有很高的救援倍率参数（9999%），适合接近濒死队友施救；保护范围和是否命中仍需判断。'],
      ['遗物改动', '绝招范围持续恢复血量属于专属遗物的附加效果，基础技能的保护效果与遗物治疗应分开看。'],
    ],
  },
  ironeye: {
    passive: [
      ['队伍收益', '提升自身及队友的物品发现能力。两类效果的发现力加算参数均为 0.3；这不是保证某一稀有物品额外增加 30 个百分点的掉落概率。'],
      ['伤害独立', '该被动本身不增加弓箭的伤害，也不改变敌人的异常阈值。'],
    ],
    skill: [
      ['制造弱点', '以短刀快速划过目标，造成命中并制造临时弱点。持续攻击弱点可使目标失衡，队友也可配合攻击。'],
      ['参数区别', '短刀命中行的基础削韧为 0；标记弱点导致的失衡另有机制，不能据此说标记没有控制作用。'],
      ['遗物改动', '次数增加提供额外储存次数；延长弱点持续时间和强化对弱点攻击属于不同词条，不应把它们算成基础技能效果。'],
    ],
    art: [
      ['箭与气流', '强力贯穿箭可穿过多个目标；箭体和伴随气流有独立命中行。地面箭体还有一个不同倍率的行，命中同一目标的次数取决于距离和部位。'],
      ['控制与伤害', '主要箭体及气流的基础削韧各为 50，冲击等级为 10。下表是各段，不能据表默认每次释放必定命中两段。'],
    ],
  },
  duchess: {
    passive: [
      ['节省精力', '攻击和闪避的精力开销较低，可衔接连续闪避，适合短兵器连续进攻后重新调整站位。'],
      ['连续闪避', '连续闪避并不意味着任意连续输入都全程无敌；不同动作之间的衔接仍需要把握时机。'],
    ],
    skill: [
      ['回放内容', '重复范围内目标刚受到的一段伤害，能够利用队友爆发。官方明确描述为最近数秒伤害的约 50%，并可在不少其他动作期间发动。'],
      ['回溯窗口待核实', '常见机制资料将窗口记为约 3 秒；官方没有给出精确秒数，本次也未定位到已确认语义的计时字段，因此这里保留待核实标记，不将 3 秒冒充已验证参数。'],
      ['异常与削韧', '异常触发伤害、异常累积、削韧是不同记录；不能仅凭“重复伤害”推断会补充同量异常累积。精确回放项与重演相互覆盖等细节仍需对应证据。'],
      ['遗物倍率', '强化技艺的遗物将重演伤害倍率参数改为 0.6；短剑连击追加的再演使用 0.4。两种效果不是同一个倍率，也不能默认相加为 1。'],
    ],
    art: [
      ['隐身作用', '暂时隐去自身与附近队友的身影，让敌人难以继续锁定，可用来重整站位、救援和接近敌人。'],
      ['持续时间口径', '隐身效果行的时长为 15 秒。这是效果参数的持续时间，起手动作、覆盖范围和特殊敌人行为仍可能影响实际体验；隐身也不等于免受范围攻击伤害。'],
    ],
  },
  raider: {
    passive: [
      ['反击强化', '受伤后可强化下一次反击，强化攻击拥有更强控制力；它与普通反击使用不同攻击行。'],
      ['低血量效果', '另有低血量触发的攻击增益：条件行的血量阈值为 25%，对应增益攻击倍率 1.5、持续 10 秒。触发条件应和强化反击状态区分，不能认为所有受伤都获得 50% 攻击提升。'],
    ],
    skill: [
      ['架势阶段', '架势期间减轻承受伤害；基础承伤倍率为 0.25，即该效果提供 75% 减伤。单次致命伤保护与后续追击要分别判断。'],
      ['普通与强化', '普通拳击倍率为虚拟武器攻击力的 130%，基础削韧 20、冲击等级 7；强化为 220%、削韧 35、冲击等级 10。强化并非只增加伤害。'],
      ['初始踏步', '起手踏步另有较小的攻击行，和拳击主体分开列出。'],
    ],
    art: [
      ['碑石用途', '召出巨大碑石，可阻挡部分远程攻击、提供攀爬位置，并提升附近友军的攻击。生成时的冲击有独立伤害，不是每次光环刷新都造成该伤害。'],
      ['增益数值', '碑石光环对应五类攻击倍率 1.15，即 15% 增益。光环效果时长字段和碑石实体存续时间不是同一个概念；延长碑石的遗物使用独立时长参数。'],
    ],
  },
  revenant: {
    passive: [
      ['敌方灵魂', '击败敌人后可能出现临时友方灵魂，持续一段时间后消失。这些灵魂和技艺召出的三位家人是两套机制。'],
      ['尸体操作', '官方角色说明还列出长按召唤指令引爆尸体的操作。能否操作特定目标需看目标条件，不能把所有首领都视为可召唤灵魂。'],
    ],
    skill: [
      ['三位家人', '海伦是灵活的侍从；弗雷德利克是魁梧的厨师；塞巴斯蒂安是管家。通过竖琴选择当前召唤者，不是同时无条件召出三位。'],
      ['输出口径', '各家人有独立敌人攻击表、招式和召唤强化，不存在一个可代表全部攻击的固定技能伤害。不能用竖琴虚拟武器面板代替其所有招式伤害。'],
      ['遗物改动', '部分词条通过家人命中恢复血量或附加攻击效果，按下方对应遗物查阅；这些触发不是召唤技艺天然附带。'],
    ],
    art: [
      ['不死与救援', '自己和周围队友获得不死效果，并可救起范围内濒死队友；家人进入强化状态。自身与队友的不死效果行均为 15 秒。'],
      ['不死不等于无敌', '效果期间仍有受伤、异常和位置风险，不能把“不死”解读成承伤倍率恒为 0。结束时应注意剩余血量和正在发生的连击。'],
      ['强化来源', '发动绝招后的特定攻击强化、火焰附加和灵魂爆炸等效果需要相应遗物，并非不死行军默认全部拥有。'],
    ],
  },
  recluse: {
    passive: [
      ['四类属性痕', '可收集魔力、火、雷、圣属性痕。属性痕可来自敌人，也可从受过相应属性攻击的队友身上取得；物理攻击没有对应的第五类痕。'],
      ['恢复专注值', '吸收单份属性痕对应恢复 20 点专注值的效果参数；专注值已满时仍要看实际可恢复空间。'],
    ],
    skill: [
      ['三份组合', '集齐三份痕后释放组合魔法。下方列出参数中可识别的 14 类效果：4 种纯属性、6 种双属性、4 种三属性；中文效果名是便于查询的描述名。'],
      ['组合规则', '双属性组合要占满三个槽，即其中一种两份、另一种一份；三属性各一份。吸收顺序不作为施法顺序要求，仍应按游戏当前组合预览确认。'],
      ['命中与增益', '有的组合以伤害为主，有的是防护、恢复、反射或专注值增益。多段持续攻击的总伤害取决于实际命中次数，表中不凭空给出一个固定总伤害。'],
    ],
    art: [
      ['血印效果', '对附近敌人施加血印；攻击带印敌人可恢复血量和专注值。攻击者恢复属于命中触发，不能把它当成持续自然恢复。'],
      ['敌方承伤', '血印对应效果行持续 12.5 秒，八类伤害承伤倍率为 1.15，即多承受 15% 伤害。异常累积相关倍率另有字段，不与伤害倍率混算。'],
    ],
  },
  executor: {
    passive: [
      ['触发条件', '受异常影响后恢复时获得强化。官方列出自然消退，以及使用对应苔药或净化地点解除异常两种途径；不同异常的生效与解除流程需分别判断。'],
      ['强化参数', '参数链为 1.5 秒起始效果接 18.5 秒后续效果，合计 20 秒。五类攻击倍率 1.2，精力恢复速度加算 15。加算速度不是“精力恢复提升 15%”。'],
    ],
    skill: [
      ['弹反与解放', '拔刀后用精准防御弹开攻击并积蓄刀身，解放后可使用强化斩击；持刀时移动操作受限。不能把普通盾牌格挡与妖刀精准防御视为同一机制。'],
      ['积蓄不是敌人削韧', '可核对的刀身累积行分别为格挡 +5、弹开 +15、带击退弹开 +20。这是刀身内部量表的参数，不能推断为任何招式固定削韧 15。'],
      ['攻击模式', '未解放与解放斩击使用不同攻击倍率；下表给出对应斩击行。普通连击另有独立各段参数，不以单次斩击代替整套连段。'],
      ['收刀与再拔刀', '拔刀姿态没有普通技艺式的冷却，可以按需要切换；官方说明刀身已积累的力量在收刀后保留。面对不熟悉的招式，仍需先辨认哪些攻击能够弹开。'],
    ],
    art: [
      ['兽形操作', '变身后使用独立的兽形轻击、重击、跳跃、咆哮和终结攻击。兽形消耗绝招量表，可主动结束；终结攻击和常规轻重击应分开看。'],
      ['属性变化', '兽形的生命上限效果倍率为 2，攻击随兽形等级修正。下表展示兽形攻击行的原始分量；它们还受兽形专用效果影响，不能和人形武器面板直接比较。'],
      ['招式分段', '轻击第三段、重击第二段与冲击波都有不同命中行。冲击波是否同时命中由距离决定，不应把所有列出的行当作一次必中的总和。'],
    ],
  },
  scholar: {
    passive: [
      ['按道具类别成长', '道具使用会积累所属类别的熟练经验，解锁该类道具的强化及额外效果；是各类别分别记录，不能用投掷壶的熟练度代替所有道具。'],
      ['强化方向', '官方举例包括投掷壶和飞刀伤害、温热石治疗及额外效果。下方列出九类道具的二、三级经验阈值；这些数值是经验，不是需要使用的次数。'],
    ],
    skill: [
      ['观察推进', '持续观察目标取得记录，进度越深效果越强。参数阈值为第一阶段 0、第二阶段 50、第三阶段 100；进度单位不是秒数。'],
      ['对敌效果', '前两阶段对应五类攻击力倍率 0.9；第三阶段的目标承伤倍率为 1.6，效果行持续 10 秒。应区分降低对方攻击与增加对方承伤。'],
      ['自身防护', '最终自用防护效果行时长 1.5 秒、伤害倍率为 0；它是分析流程中的短暂防护，不能说整个观察期间都无敌。'],
    ],
    art: [
      ['连结对象', '连结敌人与友军，敌方之间传递伤害，攻击者获得部分治疗。连结是关系机制，不能简单当成对单体固定倍率的直伤技能。'],
      ['连结维持', '官方提示受到已连结敌人的攻击可能切断友军连线。主要连结效果行持续 20.1 秒；动画和实际连线建立、断裂仍会影响有效时间。'],
      ['数值范围', '传递伤害与治疗的精确比例尚未定位到已确认语义的参数，本次不填推测数值。命中表的 0 代表辅助攻击行无直接基础伤害，不代表共感术没有输出收益。'],
    ],
  },
  undertaker: {
    passive: [
      ['额外绝招机会', '附近队友发动绝招时，可获得额外使用自己绝招的机会，不要求自己的量表先充满。接近躲避特定带黑暗力量的攻击或抓取，也可能触发。'],
      ['机会窗口', '额外绝招许可效果行时长为 4 秒，要及时使用。它是暂时使用许可，不等于永久充满一管量表；哪些敌招能触发仍须逐招确认。'],
    ],
    skill: [
      ['普通恍惚', '普通状态时长参数为 8 秒，提升动作机动性和抗打断能力。基础增益的五类攻击力倍率为 1.1，八类伤害承伤倍率为 0.65，即 35% 减伤。'],
      ['连续命中强化', '连续攻击触发的额外攻击力效果倍率为 1.1。这里列出两个独立参数；不同触发阶段和叠加结果不能只用两条描述直接加算为 20%。'],
      ['消耗量表强化', '量表满时可消耗量表进入更深的恍惚：持续参数增加至 15 秒，并获得自动回避来袭攻击的能力。强化的重点是持续时间和自动回避，不应凭空再加一档攻击倍率。'],
      ['回避边界', '自动回避不应解读成对所有抓取、地形或持续伤害都保证无敌，具体攻击适用范围仍需对应验证。'],
    ],
    art: [
      ['追踪突进', '以异骨化作长矛，飞向锁定部位攻击，可追踪范围内的空中目标。飞行段与重击段有独立攻击行，遇到障碍还会有不同碰撞结果。'],
      ['伤害与冲击', '飞行和重击行的基础物理攻击分量均为 315，基础削韧各为 20、冲击等级 10；属性补正和实际命中段数需另算。不能默认每次必定获得两段完整伤害。'],
      ['遗物联动', '绝招后能再次使用技艺、绝招后攻击增益、绝招时恢复触碰到的我方人物血量是不同词条；下方分别列出。'],
    ],
  },
};
const channels = [['物理','attackBasePhysics','physicsAtkRate','atkPhys','atkPhysCorrection'],['魔力','attackBaseMagic','magicAtkRate','atkMag','atkMagCorrection'],['火','attackBaseFire','fireAtkRate','atkFire','atkFireCorrection'],['雷','attackBaseThunder','thunderAtkRate','atkThun','atkThunCorrection'],['圣','attackBaseDark','darkAtkRate','atkDark','atkDarkCorrection']];
function hit(id,label,weaponId=null,table='AtkParam_Pc') {
  const a=row(table,id), w=weaponId===null?null:row('EquipParamWeapon',weaponId);
  const growth=w?Array.from({length:15},(_,i)=>{
    const r=row('ReinforceParamWeapon',w.reinforceTypeId+i);
    return Object.fromEntries(channels.map(([name,,field])=>[name,clean(r[field])]));
  }):[];
  const damage=channels.map(([name,base,,flat,mv])=>({name,flat:a[flat],base:w?.[base]??0,motion:a[mv]})).filter(v=>v.flat||v.base&&v.motion);
  const poise=clean(a.atkSuperArmor+(w?w.saWeaponDamage*a.atkSuperArmorCorrection/100:0));
  return {id,table,label,weaponId,damage,growth,poise,impact:a.dmgLevel,revive:a.reviveDamageCorrection,
    scaling:w?['correctStrength','correctAgility','correctMagic','correctFaith','correctLuck'].some(f=>w[f]>0):table==='AtkParam_Npc'};
}
const hits = {
  wylder:{skill:[hit(600000000,'出钩',60000000),hit(600000005,'回拉',60000000)],art:[hit(700000006,'轻按爆炸',60010000),hit(700000001,'蓄力爆炸',60010000),hit(700000016,'空中爆炸',60010000)]},
  guardian:{skill:[hit(600000050,'蓄力旋风',60100000),hit(600000055,'未蓄力旋风',60110000)],art:[hit(700000060,'起飞',60120000),hit(700000050,'俯冲',60120000),hit(700000065,'落地攻击行',60120000)]},
  ironeye:{skill:[hit(600000110,'短刀命中',60230000)],art:[hit(700000100,'主要箭体',60210000),hit(700000101,'伴随气流',60210000),hit(700000102,'地面箭体变体',60210000)]},
  raider:{skill:[hit(600000220,'起手踏步',60400000),hit(600000200,'普通反击',60400000),hit(600000210,'强化反击',60400000)],art:[hit(700000200,'碑石生成冲击',60410000)]},
  executor:{skill:[hit(600000355,'未解放刀身斩击',60700000),hit(600000350,'解放刀身斩击',60710000)],art:[[10100,'轻击一'],[10110,'轻击二'],[10120,'轻击三·前段'],[10121,'轻击三·后段'],[10130,'轻击四'],[10135,'轻击四·冲击波'],[10150,'重击一'],[10170,'重击二·前段'],[10171,'重击二·后段'],[10175,'重击二·冲击波'],[10200,'回避攻击'],[10250,'跳跃攻击'],[10255,'跳跃冲击波'],[10400,'咆哮'],[10450,'终结攻击'],[10455,'终结攻击投射行'],[10700,'变身咆哮']].map(([id,label])=>hit(id,label,null,'AtkParam_Npc'))},
  undertaker:{art:[hit(700000450,'飞行命中',60950000),hit(700000460,'重击命中',60950000)]},
};
const mixes = [
  ['火','三份火','火球与燃烧地面','火球命中后另有地面火焰段。持续燃烧需要实际留在范围内。',[[80000,'火球'],[80002,'地面火焰']]],
  ['魔力','三份魔力','魔力弹连击','初击与后续弹使用不同攻击行，伤害按命中段计算。',[[80100,'初击'],[80101,'后续弹']]],
  ['雷','三份雷','雷击与回避强化','附带回避相关强化效果，时长参数为 20 秒。雷击与残留雷电分开计算。',[[80200,'雷击'],[80201,'残留雷电']]],
  ['圣','三份圣','防护','防护效果持续参数为 30 秒，八类承伤倍率 0.9，即 10% 减伤。',[]],
  ['魔力 + 火','两份其一、一份另一','追踪火焰','缓慢追踪目标的火焰，飞行接触和脉冲使用不同攻击行。',[[81000,'飞行接触'],[81005,'火焰脉冲']]],
  ['火 + 雷','两份其一、一份另一','雷火打击','雷击与火焰弹的伤害属性不同，不能把两者都算成火伤。',[[81100,'雷击'],[81110,'火焰弹']]],
  ['火 + 圣','两份其一、一份另一','生命之焰','带有血量交换、生命上限及恢复相关效果。血量交换行 3 秒、生命上限相关行 60 秒；完整结算比例仍待核实。',[]],
  ['魔力 + 雷','两份其一、一份另一','雷光波刃','波与刃的参数伤害类型均为雷；名称中的魔力痕不代表最终必为魔力伤害。',[[81300,'雷波'],[81310,'雷刃']]],
  ['魔力 + 圣','两份其一、一份另一','免专注值魔幕','魔幕对应效果持续 8 秒，魔法、祷告、战技等专注值消耗倍率为 0。受具体动作耗费类型限制。',[]],
  ['雷 + 圣','两份其一、一份另一','反射防护','反射相关状态时长参数为 15 秒；反射结果取决于来袭投射物，不存在通用固定反射伤害。',[]],
  ['魔力 + 火 + 雷','各一份','重力漩涡','吸引周围敌人的重力攻击，中心与远近持续段使用不同参数。',[[82000,'中心爆发'],[82010,'近距段'],[82011,'中距段'],[82012,'远距段']]],
  ['魔力 + 火 + 圣','各一份','恢复吐息','吐息伤害行属于火，同时存在恢复血量与专注值的附加效果；恢复次数需看实际命中。',[[82100,'火焰吐息']]],
  ['火 + 雷 + 圣','各一份','强力雷击','包含大雷击、植入段与持续雷电行。不要将不同距离和触发时点的行默认全部相加。',[[82200,'大雷击'],[82201,'植入段'],[82202,'持续雷电'],[82210,'残留雷电']]],
  ['魔力 + 雷 + 圣','各一份','冰冻风暴','初击与风暴均为魔力伤害；风暴附带冻伤累积，附加效果行的单次冻伤基础值为 29。',[[82300,'初击'],[82310,'风暴']]],
].map(([elements,recipe,name,description,attacks])=>({elements,recipe,name,description,hits:attacks.map(([id,label])=>hit(id,label))}));
const itemNames={Dart:'飞刀',Pot:'投掷壶',Bolus:'苔药',Stone:'石类',Tear:'露滴',Perfume:'调香',Grease:'油脂',Food:'食物',Tool:'工具'};
const scholarItems=Object.entries(itemNames).map(([key,name])=>({name,level2:pc['bagcraftXp_Level2_'+key],level3:pc['bagcraftXp_Level3_'+key]}));
const heroData=JSON.parse(fs.readFileSync('src/data/hero-abilities.json','utf8'));
const output={gameVersion:'regulation 1.03.5 + DLC1',checkedAt:'2026-11-20',
  regulationSha256:createHash('sha256').update(fs.readFileSync('D:/SteamLibrary/steamapps/common/ELDEN RING NIGHTREIGN/Game/regulation.bin')).digest('hex'),
  definitionCommit:'f5969c060cea240476e9dd4d6a64eafa9dbafaab',
  sources:{definitions:'https://github.com/vawser/Smithbox/tree/f5969c060cea240476e9dd4d6a64eafa9dbafaab/src/Smithbox.Data/Assets/PARAM/NR',advanced:'https://en.bandainamcoent.eu/elden-ring/news/advanced-tips-elden-ring-nightreign',dlc:'https://en.bandainamcoent.eu/elden-ring/news/elden-ring-nightreign-meet-the-new-nightfarers-scholar-and-undertaker'},
  heroes:heroData.heroes.map((h,i)=>({key:h.key,cooldown:row('HeroParam',i+1).characterAbilityCooldown,abilities:h.abilities.map(a=>({kind:a.kind,details:text[h.key][a.kind].map(([title,body])=>({title,body})),hits:hits[h.key]?.[a.kind]??[]}))})),
  mixes,scholarItems,evidence};
assert.equal(mixes.length,14);
assert.equal(output.heroes.flatMap(h=>h.abilities).length,30);
fs.writeFileSync('src/data/hero-mechanics.json',JSON.stringify(output,null,2)+'\n');
console.log('Prepared detailed mechanics for all 30 abilities, 14 mixtures and '+evidence.length+' checked facts.');
