import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS } from "@/lib/mock-data";

const DOT_CLASS = {
  submitted: "bg-neutral-500",
  queued: "bg-neutral-500",
  reviewing: "bg-accent-600",
  completed: "bg-emerald-600",
  needs_attention: "bg-amber-600",
  failed: "bg-red-600",
};

export function StatusBadge({ status, className }) {
  const label = STATUS_LABELS[status] ?? status;
  return (
    <Badge
      variant="secondary"
      className={`gap-1.5 font-normal text-neutral-700 ${className ?? ""}`}
    >
      <span
        className={`size-1.5 rounded-full ${DOT_CLASS[status] ?? "bg-neutral-500"}`}
      />
      {label}
    </Badge>
  );
}
