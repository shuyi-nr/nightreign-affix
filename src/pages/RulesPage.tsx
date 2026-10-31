import { catalog, poolCounts } from '../lib/catalog';
import { CHECK_MODES, MODE_ORDER } from '../lib/engine';

export function RulesPage() {
  const counts = poolCounts();
  return (
    <div className="card rules">
      <h2>规则说明</h2>
      <p className="hint">本页说明「三词条遗物」合法性判定的完整规则与判定顺序。点击各节标题展开 / 折叠。</p>

      <details className="rule-section" open>
        <summary>更新记录 · 2026.10.31 · 角色、Boss 与夜王推算</summary>
        <ul className="release-notes">
          <li>新增角色数值页：10 位角色（含学者、送葬者），支持 1–15 级切换；八维雷达图直接标注数值，配合彩色属性条与点击定位，HP / FP / 精力独立展示。</li>
          <li>新增 Boss 抗性页：127 个条目、229 个阶段 / 场合变体，包含普通夜王、永夜与救世旗手形态；展示八类伤害减伤率与异常状态阈值，负减伤明确表示弱点。</li>
          <li>新增随机夜王推算：依据 520 条真实模式记录（基础 320 / DLC 200），用第一夜、第二夜 Boss、地形与资料范围筛选候选，并可查看匹配的模式编号。</li>
          <li>全角色使用统一 0–80 图表刻度；不把图形面积当综合战力，不把模式数量当抽选概率，也不由守夜组合推断普通 / 永夜形态。</li>
          <li>补齐各页版本与来源说明：角色和 Boss 参数为 v1.03.5 + DLC1；模式资料为 1.03.2。发布前重新核对角色 1,650 项数值、Boss 1,832 项承伤倍率与 1,603 项异常阈值、全部 520 条模式配对，均与来源一致。</li>
          <li>手机布局与离线访问同步适配；反馈模板按所在页面填写相应数据版本，方便定位问题。</li>
        </ul>
        <p className="hint release-notes">数值核对针对注明版本的参数和公开记录，不等同于全部战斗场景逐项实机测试。Boss 图展示基础参数，部位、临时增益等可能影响实战；无法确认的变体用途及模式版本局限均在页面注明。</p>
      </details>

      <details className="rule-section">
        <summary>更新记录 · 2026.10.23</summary>
        <ul className="release-notes">
          <li>手机与平板新增「狸喵芝士」悬浮菜单：点击立即播放音效，展开四字贴纸可重播；选词条时自动隐藏。</li>
          <li>深夜新增完整检测开关：选择具体三词条遗物，逐行校验正面与负面；分享链接和收藏同时保存配对。</li>
          <li>冲突槽位高亮，顺序错误可一键调整；深夜排序时负面跟随正面整行移动。</li>
          <li>选词条新增最近使用、清空搜索，手机全屏选择与键盘操作更方便。</li>
          <li>收藏支持自定义名称与改名，保留导出、导入备份功能。</li>
          <li>新增问题反馈和公开浏览量；计数需要联网，不上传检测组合或收藏。历史未记录访问无法补回。</li>
        </ul>
        <p className="hint release-notes">深夜正面预检仍按七种槽池模板检查；完整检测依据上游 RelicAudit 的真实存档规则，使用深夜 A/B/C 池并集及逐行诅咒配对。两者判定范围不同。遗物类型数据来自与词条库同版的 EquipParamAntique。</p>
      </details>

      <details className="rule-section" open>
        <summary>判定顺序（严格按此执行）</summary>
        <ol>
          <li>
            <strong>数量与存在性</strong>：词条数量必须等于遗物槽位（3 个）；每个 <code>effectId</code> 存在且版本兼容。
          </li>
          <li>
            <strong>重复检查</strong>：同一个 <code>effectId</code> 不能在一件遗物上出现两次。
          </li>
          <li>
            <strong>冲突（互斥）检查</strong>：所有词条的 <code>compatibilityId</code>（若 ≠ -1）必须两两不同；
            相同即冲突，不能同时出现在同一件遗物上。这是最核心的非法判定。
          </li>
          <li>
            <strong>池子检查</strong>：词条必须属于对应遗物类型和版本的合法出货池
            （普通当前池 110/210/310、旧池 100/200/300、深夜正面池 2000000/2100000/2200000）。
          </li>
          <li>
            <strong>排序规范化</strong>：正确顺序按 <code>(sortId, effectId)</code> 升序；
            输入顺序不符时标记为「顺序错误」（与「内容非法」区分）。
          </li>
          <li>
            <strong>深夜配对</strong>：A 池（需诅咒）正面词条数量 = 负面词条数量，按槽位一一配对；
            B 池（不需诅咒）正面词条不得附带负面词条。
          </li>
        </ol>
      </details>

      <details className="rule-section">
        <summary>检测口径（版本切换）</summary>
        <table className="field-table">
          <thead>
            <tr>
              <th>口径</th>
              <th>适用</th>
              <th>槽池模板</th>
            </tr>
          </thead>
          <tbody>
            {MODE_ORDER.map((key) => (
              <tr key={key}>
                <td>
                  <strong>{CHECK_MODES[key].title}</strong>
                </td>
                <td>{CHECK_MODES[key].detail}</td>
                <td>
                  {CHECK_MODES[key].slotPoolSequences.length === 0
                    ? '—'
                    : CHECK_MODES[key].slotPoolSequences.map((s) => s.join('/')).join('；')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>

      <details className="rule-section">
        <summary>字段含义</summary>
        <table className="field-table">
          <thead>
            <tr>
              <th>字段</th>
              <th>含义</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>effectId</code>
              </td>
              <td>词条唯一编号（游戏参数 ID）。</td>
            </tr>
            <tr>
              <td>
                <code>compatibilityId</code>
              </td>
              <td>冲突组；非 -1 的值两两不同才合法。</td>
            </tr>
            <tr>
              <td>
                <code>sortId</code>
              </td>
              <td>排序键（游戏参数 <code>overrideEffectId</code>）；正确顺序按 (sortId, effectId) 升序。</td>
            </tr>
            <tr>
              <td>
                <code>poolIds</code>
              </td>
              <td>所属可抽取池。普通旧池 100/200/300；当前池 110/210/310；深夜 2000000/2100000/2200000。</td>
            </tr>
            <tr>
              <td>
                <code>isCurse</code>
              </td>
              <td>深夜负面词条标记。</td>
            </tr>
            <tr>
              <td>
                <code>requiresCurse</code>
              </td>
              <td>深夜 A 池（需诅咒）正面词条标记。</td>
            </tr>
          </tbody>
        </table>
      </details>

      <details className="rule-section">
        <summary>当前数据口径</summary>
        <table className="field-table">
          <tbody>
            <tr>
              <td>数据版本</td>
              <td>
                <code>{catalog.gameVersion}</code>（{catalog.dataVersion}）
              </td>
            </tr>
            <tr>
              <td>词条记录</td>
              <td>{counts.total} 条</td>
            </tr>
            <tr>
              <td>普通当前池可抽</td>
              <td>{counts.normalCurrent} 条</td>
            </tr>
            <tr>
              <td>普通旧池可抽</td>
              <td>{counts.normalLegacy} 条</td>
            </tr>
            <tr>
              <td>深夜正面可抽</td>
              <td>{counts.deepPositive} 条</td>
            </tr>
            <tr>
              <td>深夜负面词条</td>
              <td>{counts.deepCurse} 条</td>
            </tr>
            <tr>
              <td>深夜 A 池（需诅咒）</td>
              <td>{counts.requiresCurse} 条</td>
            </tr>
            <tr>
              <td>参考 / 已移除词条（不可抽取）</td>
              <td>{catalog.referenceOnly.length} 条</td>
            </tr>
          </tbody>
        </table>
      </details>

      <p className="small muted">
        数据来源：游戏参数与官方简中文本，以及开源项目 nightreign-relic-checker（数据生成逻辑见其 PROVENANCE 文档）。
        本工具为非官方第三方工具，数据仅供参考。
      </p>
    </div>
  );
}
