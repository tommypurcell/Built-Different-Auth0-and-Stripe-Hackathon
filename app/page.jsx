"use client";

import { useEffect, useState } from "react";
import { getEvents } from "@/lib/storage";
import { EventRow } from "@/components/event-row";

export default function DiscoverPage() {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    getEvents().then(setEvents);
  }, []);

  const filtered = events.filter((e) =>
    tab === "upcoming" ? e.status !== "past" : e.status === "past"
  );

  return (
    <div className="mx-auto flex max-w-content flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">
          Discover Events
        </h1>
        <p className="text-muted-foreground">
          Explore hackathons and see which products rise to the top.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {["upcoming", "past"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        {filtered.length === 0 ? (
          <p className="py-8 text-sm text-muted-foreground">
            No {tab} events.
          </p>
        ) : (
          filtered.map((event) => <EventRow key={event.id} event={event} />)
        )}
      </div>
    </div>
  );
}
