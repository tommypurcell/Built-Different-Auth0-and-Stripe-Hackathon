import { SubmissionForm } from "@/components/submission-form";

export default function SubmitPage() {
  return (
    <div className="mx-auto flex max-w-content flex-col gap-10 px-6 py-10 md:py-14">
      <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr] md:items-start">
        <div className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(244,241,255,0.92))] p-8 shadow-[0_24px_70px_-40px_rgba(38,33,20,0.35)]">
          <span className="w-fit rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-accent-800">
            Submission room
          </span>
          <h1 className="text-4xl font-semibold tracking-[-0.04em]">
            Give judges the shortest possible path to believing the product.
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            The strongest entries are not the longest. They are obvious in
            thirty seconds, polished in two minutes, and monetized before the
            demo ends.
          </p>
        </div>
        <SubmissionForm />
      </div>
    </div>
  );
}
