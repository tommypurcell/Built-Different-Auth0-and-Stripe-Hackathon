import { updateReviewJob, updateSubmissionStatus } from "./storage";

const STAGE_DELAY_MS = { toQueued: 400, toReviewing: 1400, toFinal: 2600 };

function randomOutcome() {
  const roll = Math.random();
  if (roll < 0.08) return "failed";
  if (roll < 0.18) return "needs_attention";
  return "completed";
}

function randomScore() {
  return Math.floor(65 + Math.random() * 34);
}

// Drives one review job through queued -> reviewing -> final status on
// staggered timers, persisting each transition through the storage layer.
// onChange is called after every persisted update so the UI can re-render.
export function runJudgingJob(job, { onChange } = {}) {
  const staggerMs = Math.random() * 1500;

  setTimeout(async () => {
    const updated = await updateReviewJob(job.id, { status: "queued" });
    await updateSubmissionStatus(job.submissionId, "queued");
    onChange?.(updated);
  }, staggerMs + STAGE_DELAY_MS.toQueued);

  setTimeout(async () => {
    const updated = await updateReviewJob(job.id, { status: "reviewing" });
    await updateSubmissionStatus(job.submissionId, "reviewing");
    onChange?.(updated);
  }, staggerMs + STAGE_DELAY_MS.toReviewing);

  setTimeout(async () => {
    const finalStatus = randomOutcome();
    const score = finalStatus === "failed" ? null : randomScore();
    const feedback =
      finalStatus === "failed"
        ? "Automated review could not reach the product URL."
        : finalStatus === "needs_attention"
        ? "Scored, but judges should confirm the core flow manually."
        : "Reviewed successfully against the submitted instructions.";

    const updated = await updateReviewJob(job.id, {
      status: finalStatus,
      score,
      feedback,
      completedAt: new Date().toISOString(),
    });
    await updateSubmissionStatus(job.submissionId, finalStatus);
    onChange?.(updated);
  }, staggerMs + STAGE_DELAY_MS.toFinal);
}
