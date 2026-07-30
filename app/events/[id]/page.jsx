"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getEvent, getSubmissionsForEvent } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";

export default function EventDetailPage({ params }) {
  const { id } = use(params);
  const [event, setEvent] = useState(undefined);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    getEvent(id).then(setEvent);
    getSubmissionsForEvent(id).then(setSubmissions);
  }, [id]);

  if (event === undefined) return null;

  if (event === null) {
    return (
      <div className="mx-auto flex max-w-content flex-col gap-4 px-6 py-16">
        <p className="text-muted-foreground">Event not found.</p>
        <Link href="/" className="text-sm underline">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-6 py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">
            {event.name}
          </h1>
          <p className="text-muted-foreground">{event.host}</p>
          <p className="text-sm text-muted-foreground">
            {event.dateLabel} · {event.time}
          </p>
          <p className="text-sm text-muted-foreground">{event.location}</p>
        </div>
        <div
          className="h-32 w-full shrink-0 rounded-2xl md:w-48"
          style={{ background: event.coverColor }}
        />
      </div>

      <p className="max-w-2xl text-sm leading-6">{event.description}</p>

      <Button asChild size="lg" className="self-start">
        <Link href="/submit">Submit Project</Link>
      </Button>

      <Separator />

      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Prizes
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {event.prizes.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Schedule
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {event.schedule.map((s) => (
              <li key={s.time} className="flex gap-3">
                <span className="w-20 shrink-0 text-muted-foreground">
                  {s.time}
                </span>
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
          <p className="pt-2 text-sm text-muted-foreground">
            Submission deadline: {event.submissionDeadline}
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col gap-6">
        <h2 className="text-lg font-medium">Submitted Projects</h2>
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/submissions/${s.id}`}
              className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-secondary"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{s.name}</span>
                <span className="text-sm text-muted-foreground">
                  {s.category}
                </span>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
