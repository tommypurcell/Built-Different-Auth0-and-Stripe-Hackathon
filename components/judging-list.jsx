import { StatusBadge } from "@/components/status-badge";

export function JudgingList({ rows }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
      {rows.map((row) => (
        <div
          key={row.job.id}
          className="flex items-center justify-between gap-4 px-6 py-4"
        >
          <div className="flex flex-col gap-1">
            <div className="font-medium">{row.submission?.name ?? "Unknown project"}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {row.job.id}
            </div>
          </div>
          <StatusBadge status={row.job.status} />
        </div>
      ))}
    </div>
  );
}
