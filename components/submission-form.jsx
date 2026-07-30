"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createSubmission } from "@/lib/storage";

export function SubmissionForm() {
  const [name, setName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    const record = await createSubmission({ name, productUrl, instructions });
    setSubmission(record);
    setSubmitting(false);
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
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Built Different HQ"
          className="h-12 rounded-2xl border-white bg-neutral-100/80 shadow-none"
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
          className="h-12 rounded-2xl border-white bg-neutral-100/80 shadow-none"
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
          className="rounded-[24px] border-white bg-neutral-100/80 shadow-none"
        />
      </div>
      <Button
        type="submit"
        disabled={submitting}
        className="h-12 self-start rounded-full px-6"
      >
        {submitting ? "Submitting..." : "Submit Project"}
      </Button>
    </form>
  );
}
