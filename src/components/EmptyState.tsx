interface Props {
  icon?: string;
  title: string;
  hint?: string;
  className?: string;
}

/** Unified empty-state visual (icon + title + optional hint). */
export function EmptyState({ icon = '🔍', title, hint, className }: Props) {
  return (
    <div className={`empty-state${className ? ` ${className}` : ''}`}>
      <div className="empty-state-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="empty-state-title">{title}</div>
      {hint && <div className="empty-state-hint">{hint}</div>}
    </div>
  );
}
