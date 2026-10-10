export default function TreeView({ root, type }) {
  if (!root) {
    return <div className="text-slate-500 text-sm py-10 text-center">No network data yet.</div>;
  }

  const renderNode = (node, depth) => {
    if (!node) return null;
    const statusColor =
      node.status === "active" ? "border-emerald-400/40 bg-emerald-400/5" : "border-slate-600/40 bg-slate-800/40";
    const children = node.children || [];
    return (
      <div className="flex flex-col items-center" key={(node.address || "") + depth}>
        <div className={`relative rounded-xl border px-3 py-2 min-w-[108px] text-center ${statusColor}`} title={node.address}>
          {type === "placement" && node.leg ? (
            <span className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-[1px] text-[8px] uppercase tracking-widest font-mono-merq ${
              node.leg === "left" ? "bg-cyan-500/20 text-cyan-300" : "bg-amber-500/20 text-amber-300"}`}>
              {node.leg}
            </span>
          ) : null}
          <div className="font-mono-merq text-[11px] text-slate-200">{node.short}</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className={`h-1.5 w-1.5 rounded-full ${node.status === "active" ? "bg-emerald-400" : "bg-slate-500"}`} />
            <span className="text-[9px] text-slate-500 uppercase tracking-wide">{node.rank || node.status}</span>
          </div>
        </div>

        {children.length > 0 ? (
          <div className="flex flex-col items-center">
            <div className="h-5 w-px bg-white/10" />
            <div className="flex items-start gap-5 sm:gap-8">
              {children.map((c, i) => (
                <div className="flex flex-col items-center relative pt-5" key={(c.address || "") + i}>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-px bg-white/10" />
                  {renderNode(c, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto py-6" data-testid="binary-tree-canvas">
      <div className="min-w-max px-6 flex justify-center">{renderNode(root, 0)}</div>
    </div>
  );
}
