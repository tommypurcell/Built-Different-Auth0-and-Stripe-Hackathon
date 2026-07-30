const ROWS = [
  { key: "submitted", label: "Submitted" },
  { key: "queued", label: "Queued" },
  { key: "reviewing", label: "Reviewing" },
  { key: "completed", label: "Completed" },
  { key: "needs_attention", label: "Needs Attention" },
  { key: "failed", label: "Failed" },
];

export function JudgingProgress({ counts }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-6 rounded-2xl border border-border bg-surface p-8 sm:grid-cols-3">
      {ROWS.map((row) => (
        <div key={row.key} className="flex flex-col gap-1">
          <div className="text-2xl font-medium tabular-nums">
            {counts[row.key] ?? 0}
          </div>
          <div className="text-sm text-muted-foreground">{row.label}</div>
        </div>
      ))}
    </div>
  );
}
