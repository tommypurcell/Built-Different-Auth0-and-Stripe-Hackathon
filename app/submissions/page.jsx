"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMySubmissions, getEvent } from "@/lib/storage";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

export default function MySubmissionsPage() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const submissions = await getMySubmissions();
      const withEvents = await Promise.all(
        submissions.map(async (s) => ({
          submission: s,
          event: s.eventId ? await getEvent(s.eventId) : null,
        }))
      );
      setRows(withEvents);
    })();
  }, []);

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          My Submissions
        </h1>
        <p className="text-muted-foreground">
          Track the projects you&apos;ve submitted and their review status.
        </p>
      </div>

      {rows === null ? null : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-border bg-surface p-8">
          <p className="text-muted-foreground">
            You haven&apos;t submitted any projects yet.
          </p>
          <Button asChild>
            <Link href="/submit">Submit a Project</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-surface">
          {rows.map(({ submission, event }) => (
            <Link
              key={submission.id}
              href={`/submissions/${submission.id}`}
              className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-secondary"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-medium">{submission.name}</span>
                <span className="text-sm text-muted-foreground">
                  {event ? event.name : submission.category}
                </span>
              </div>
              <StatusBadge status={submission.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
