import Link from "next/link";

export function EventRow({ event }) {
  return (
    <Link
      href={`/events/${event.id}`}
      className="flex items-center gap-6 rounded-2xl p-3 transition-colors hover:bg-secondary"
    >
      <div className="hidden w-20 shrink-0 flex-col items-center sm:flex">
        <span className="text-xs font-medium uppercase text-muted-foreground">
          {event.dateLabel.split(", ")[0]}
        </span>
        <span className="text-2xl font-semibold tracking-tight">
          {event.dateLabel.split(" ")[2]}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="font-medium">{event.name}</div>
        <div className="text-sm text-muted-foreground">
          {event.time} · {event.location}
        </div>
        <div className="text-sm text-muted-foreground">{event.host}</div>
      </div>
      <div
        className="size-16 shrink-0 rounded-xl"
        style={{ background: event.coverColor }}
      />
    </Link>
  );
}
