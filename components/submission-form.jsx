"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSubmission, getEvents } from "@/lib/storage";

export function SubmissionForm() {
  const [name, setName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [eventId, setEventId] = useState("");
  const [events, setEvents] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getEvents().then((nextEvents) => {
      setEvents(nextEvents);
      setEventId((current) => current || nextEvents[0]?.id || "");
    });
  }, []);

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("checkout_session_id");
    if (!sessionId || sessionStorage.getItem(`checkout:${sessionId}`)) return;
    sessionStorage.setItem(`checkout:${sessionId}`, "processing");
    fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Payment verification failed.");
        return createSubmission(result.submission);
      })
      .then(setSubmission)
      .catch((verificationError) => {
        sessionStorage.removeItem(`checkout:${sessionId}`);
        setError(verificationError.message);
      });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const selectedEvent = events.find((event) => event.id === eventId);
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, productUrl, instructions, eventId, eventName: selectedEvent?.name }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to start payment.");
      window.location.assign(result.url);
    } catch (submitError) {
      setError(submitError.message);
      setSubmitting(false);
    }
  }

  if (submission) {
    return (
      <div className="flex flex-col gap-6 rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_-36px_rgba(38,33,20,0.35)]">
        <div className="flex flex-col gap-2">
          <span className="w-fit rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent-800">
            Submission received
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            You&apos;re in the judging queue.
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;ll notify you once judging begins.
          </p>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Submission ID</dt>
            <dd className="font-mono">{submission.id}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="capitalize">{submission.status}</dd>
          </div>
        </dl>
        <Button asChild className="self-start">
          <Link href={`/submissions/${submission.id}`}>View Submission</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-8 rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_24px_70px_-36px_rgba(38,33,20,0.35)]"
    >
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-start">
        <div className="space-y-2">
          <span className="w-fit rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent-800">
            Ship your demo
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            Add the product judges should remember.
          </h2>
          <p className="text-sm leading-6 text-muted-foreground">
            Keep this tight: one clear URL, one sharp project name, and the
            single fastest path through your demo.
          </p>
        </div>
        <div className="rounded-[28px] border border-accent-200 bg-accent-100/70 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent-800">
            What judges need
          </p>
          <ul className="mt-3 space-y-2 text-sm text-neutral-700">
            <li>Working login or shared access path</li>
            <li>Strong one-sentence value proposition</li>
            <li>Quick monetization moment to show Stripe</li>
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="event">Event</Label>
        <select
          id="event"
          value={eventId}
          onChange={(e) => setEventId(e.target.value)}
          required
          className="h-12 w-full rounded-2xl border border-border-strong bg-white px-4 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          {events.map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Built Different HQ"
          className="h-12 rounded-2xl border-border-strong bg-white px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(17,24,39,0.04)]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="productUrl">Product URL</Label>
        <Input
          id="productUrl"
          type="url"
          placeholder="https://"
          value={productUrl}
          onChange={(e) => setProductUrl(e.target.value)}
          required
          className="h-12 rounded-2xl border-border-strong bg-white px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(17,24,39,0.04)]"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="instructions">Instructions for judges</Label>
        <Textarea
          id="instructions"
          rows={6}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Tell judges exactly where to click, which account to use, and what product moment sells the idea fastest."
          className="rounded-[24px] border-border-strong bg-white px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_2px_rgba(17,24,39,0.04)]"
        />
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className="h-12 self-start rounded-full px-6"
      >
        {submitting ? "Opening checkout..." : "Pay $5 and submit"}
      </Button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-muted-foreground">One-time submission fee. Secure payment powered by Stripe.</p>
    </form>
  );
}
