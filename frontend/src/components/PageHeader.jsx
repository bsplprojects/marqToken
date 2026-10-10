export function PageHeader({ title, subtitle, eyebrow, action }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8 fade-up">
      <div>
        {eyebrow && (
          <div className="font-mono-merq text-[11px] uppercase tracking-[0.25em] text-amber-400/80 mb-2">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">{title}</h1>
        {subtitle && <p className="text-slate-400 mt-2 max-w-2xl">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ children, className = "", testid }) {
  return (
    <div
      data-testid={testid}
      className={`glass rounded-2xl border border-white/8 ${className}`}
    >
      {children}
    </div>
  );
}
