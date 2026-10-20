import { catalog, poolCounts } from '../lib/catalog';
import { CHECK_MODES, MODE_ORDER } from '../lib/engine';

export function RulesPage() {
  const counts = poolCounts();
  return (
    <div className="card rules">
      <h2>规则说明</h2>
      <p className="hint">本页说明「三词条遗物」合法性判定的完整规则与判定顺序。</p>

      <h3>判定顺序（严格按此执行）</h3>
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

      <h3>检测口径（版本切换）</h3>
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

      <h3>字段含义</h3>
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

      <h3>当前数据口径</h3>
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

      <p className="small muted">
        数据来源：游戏参数与官方简中文本，以及开源项目 nightreign-relic-checker（数据生成逻辑见其 PROVENANCE 文档）。
        本工具为非官方第三方工具，数据仅供参考。
      </p>
    </div>
  );
}
