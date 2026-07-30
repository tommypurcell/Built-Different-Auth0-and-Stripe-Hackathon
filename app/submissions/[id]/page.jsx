"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getSubmission, getReviewJobForSubmission } from "@/lib/storage";
import { StatusBadge } from "@/components/status-badge";
import { Separator } from "@/components/ui/separator";

export default function SubmissionDetailPage({ params }) {
  const { id } = use(params);
  const [submission, setSubmission] = useState(undefined);
  const [reviewJob, setReviewJob] = useState(null);

  useEffect(() => {
    getSubmission(id).then(setSubmission);
    getReviewJobForSubmission(id).then(setReviewJob);
  }, [id]);

  if (submission === undefined) return null;

  if (submission === null) {
    return (
      <div className="mx-auto flex max-w-[640px] flex-col gap-4 px-6 py-16">
        <p className="text-muted-foreground">Submission not found.</p>
        <Link href="/" className="text-sm text-accent-foreground underline">
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[640px] flex-col gap-8 px-6 py-16">
      <div
        className="h-32 w-full rounded-2xl"
        style={{ background: submission.coverColor }}
      />

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            {submission.name}
          </h1>
          <StatusBadge status={submission.status} />
        </div>
        <p className="text-sm text-muted-foreground">{submission.category}</p>
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          Product URL
        </h2>
        <a
          href={submission.productUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent-foreground underline underline-offset-2"
        >
          {submission.productUrl}
        </a>
      </div>

      {submission.instructions ? (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Instructions for judges
          </h2>
          <p className="text-sm">{submission.instructions}</p>
        </div>
      ) : null}

      {reviewJob && (reviewJob.score != null || reviewJob.feedback) ? (
        <>
          <Separator />
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-muted-foreground">
              Judging result
            </h2>
            {reviewJob.score != null ? (
              <p className="text-2xl font-medium tabular-nums">
                {reviewJob.score}
              </p>
            ) : null}
            {reviewJob.feedback ? (
              <p className="text-sm text-muted-foreground">
                {reviewJob.feedback}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
