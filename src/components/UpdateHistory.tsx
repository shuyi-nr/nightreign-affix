import { useId, useState } from 'react';
import { updates } from '../data/updates';
import './UpdateHistory.css';

export function UpdateHistory() {
  const dateId = useId();
  const titleId = useId();
  const [selectedDate, setSelectedDate] = useState(updates[0]?.date);
  const selected = updates.find((update) => update.date === selectedDate) ?? updates[0];

  if (!selected) return null;

  return (
    <details className="rule-section update-history">
      <summary>更新记录</summary>
      <div className="update-history__body">
        <div className="update-history__toolbar">
          <label htmlFor={dateId}>选择日期</label>
          <select
            id={dateId}
            className="update-history__date"
            value={selected.date}
            onChange={(event) => setSelectedDate(event.target.value)}
          >
            {updates.map((update) => (
              <option key={update.date} value={update.date}>
                {update.date.replaceAll('-', '.')}
                {update.status === 'local-preview' ? ' · 本地预览未发布' : ''}
              </option>
            ))}
          </select>
        </div>
        <article className="update-history__entry" aria-labelledby={titleId}>
          <header className="update-history__heading">
            <h3 id={titleId}>
              <time dateTime={selected.date}>{selected.date.replaceAll('-', '.')}</time>
              <span>{selected.title}</span>
            </h3>
            {selected.status === 'local-preview' && (
              <span className="update-history__badge">本地预览未发布</span>
            )}
          </header>
          <ul className="update-history__items">
            {selected.items.map((item) => <li key={item}>{item}</li>)}
          </ul>
          {selected.notes.map((note) => (
            <p key={note} className="update-history__note">{note}</p>
          ))}
        </article>
      </div>
    </details>
  );
}
