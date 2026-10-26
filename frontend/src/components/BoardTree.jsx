// Renders a binary subtree as rows: row k has 2^k spots (filled or empty).
const rowsOf = (tree, depth) => {
  const rows = [[tree]];
  for (let k = 1; k <= depth; k++) {
    rows.push(rows[k - 1].flatMap((n) => [n?.children?.[0] || null, n?.children?.[1] || null]));
  }
  return rows;
};

const Spot = ({ n, isRoot, isSelf, onFocus }) => {
  if (!n) return <div className="h-9 w-9 mx-auto rounded-full border border-dashed border-white/10" title="Open spot" />;
  const tone = isRoot ? "bg-amber-400 text-slate-950 ring-4 ring-amber-400/20" : n.direct ? "bg-amber-400/20 text-amber-200 border border-amber-400/50" : "bg-cyan-400/15 text-cyan-200 border border-cyan-400/40";
  return (
    <button data-testid="tree-spot" onClick={() => !isRoot && onFocus(n.address.toLowerCase())} title={`${n.address}${n.has_more ? " · has more below" : ""}`}
      className={`h-9 w-9 mx-auto rounded-full flex items-center justify-center font-mono-merq text-[9px] font-bold transition-transform hover:scale-110 ${tone}`}>
      {isRoot ? (isSelf ? "YOU" : n.short.slice(2, 5)) : n.short.slice(2, 5)}
      {n.has_more && <span className="absolute translate-x-3 -translate-y-3 h-2 w-2 rounded-full bg-emerald-400" />}
    </button>
  );
};

export const BoardTree = ({ tree, depth, isSelf, onFocus }) => {
  const rows = rowsOf(tree, depth);
  return (
    <div data-testid="board-tree" className="overflow-x-auto">
      <div className="min-w-[760px] space-y-5">
        {rows.map((row, k) => (
          <div key={k}>
            <div className="font-mono-merq text-[10px] uppercase tracking-widest text-slate-600 mb-2">
              {k === 0 ? "Top" : `Level ${k} · ${row.filter(Boolean).length}/${row.length} filled`}
            </div>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
              {row.map((n, i) => <div key={i} className="relative"><Spot n={n} isRoot={k === 0} isSelf={isSelf} onFocus={onFocus} /></div>)}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-slate-600 mt-5">Tap anyone in your tree to view the spots below them. A green dot means there are more levels underneath.</p>
    </div>
  );
};
