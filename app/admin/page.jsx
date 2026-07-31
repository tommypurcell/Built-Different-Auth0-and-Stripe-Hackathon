"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getSubmissions,
  getEvents,
} from "@/lib/storage";
import {
  BROWSER_MODE_OPTIONS,
  DEFAULT_BATCH_DRAFT,
  buildCreateReviewBatchPayload,
  createReviewBatch,
  finalizeReviewBatch,
  getDefaultApiConfig,
  getReviewBatch,
  getReviewJob,
  getReviewJobEvents,
  listArtifacts,
  retryReviewJob,
  REVIEW_MODE_OPTIONS,
  validateCreateReviewBatchPayload,
} from "@/lib/judge-console";

const API_SETTINGS_KEY = "judge_console_api_settings";

function EmptyState({ title, copy }) {
  return (
    <div className="rounded-[24px] border border-dashed border-border bg-surface-card px-5 py-4">
      <div className="text-sm font-medium text-text-primary">{title}</div>
      <div className="mt-1 text-sm text-muted-foreground">{copy}</div>
    </div>
  );
}

function selectClassName() {
  return "h-12 rounded-2xl border border-border bg-white px-4 text-sm text-text-primary";
}

function statusTone(status) {
  if (status === "complete") return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  if (status === "failed") return "bg-red-50 text-red-700 ring-1 ring-red-200";
  if (status === "judging") return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  if (status === "evidence") return "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200";
  return "bg-neutral-100 text-neutral-700 ring-1 ring-neutral-200";
}

export default function AdminPage() {
  const [events, setEvents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [draft, setDraft] = useState(DEFAULT_BATCH_DRAFT);
  const [apiConfig, setApiConfig] = useState(() => {
    if (typeof window === "undefined") return getDefaultApiConfig();

    const stored = window.localStorage.getItem(API_SETTINGS_KEY);
    if (!stored) return getDefaultApiConfig();

    try {
      const merged = { ...getDefaultApiConfig(), ...JSON.parse(stored) };
      // Migrate legacy configs that saved the direct upstream host (CORS-blocked
      // from the browser) onto the same-origin proxy default.
      if (/^https?:\/\//.test(merged.baseUrl)) {
        merged.baseUrl = getDefaultApiConfig().baseUrl;
      }
      return merged;
    } catch {
      window.localStorage.removeItem(API_SETTINGS_KEY);
      return getDefaultApiConfig();
    }
  });
  const [validationErrors, setValidationErrors] = useState([]);
  const [requestError, setRequestError] = useState("");
  const [requestState, setRequestState] = useState("idle");
  const [adminTab, setAdminTab] = useState("inputs");
  const [batchResponse, setBatchResponse] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [jobDetails, setJobDetails] = useState({});
  const [jobEvents, setJobEvents] = useState({});
  const [jobEventCursor, setJobEventCursor] = useState({});
  const [artifacts, setArtifacts] = useState([]);
  const [artifactState, setArtifactState] = useState("idle");

  useEffect(() => {
    getEvents().then((loadedEvents) => {
      setEvents(loadedEvents);
      setDraft((current) => {
        if (loadedEvents.some((event) => event.id === current.event_id)) return current;
        return {
          ...current,
          event_id: loadedEvents[0]?.id ?? current.event_id,
        };
      });
    });

    getSubmissions().then(setSubmissions);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(apiConfig));
    }
  }, [apiConfig]);

  useEffect(() => {
    if (!batchResponse?.batch_id) return undefined;

    let cancelled = false;

    async function syncBatch() {
      try {
        const batch = await getReviewBatch(apiConfig, batchResponse.batch_id);
        if (cancelled) return;

        setBatchDetails(batch);

        const jobs = Array.isArray(batch.review_jobs) ? batch.review_jobs : [];
        const jobRecords = await Promise.all(
          jobs.map((job) => getReviewJob(apiConfig, job.review_job_id))
        );

        if (cancelled) return;

        setJobDetails(
          Object.fromEntries(jobRecords.map((job) => [job.review_job_id, job]))
        );

        const nextEvents = {};
        const nextCursor = {};

        await Promise.all(
          jobs.map(async (job) => {
            const after = jobEventCursor[job.review_job_id] ?? 0;
            const eventResponse = await getReviewJobEvents(
              apiConfig,
              job.review_job_id,
              after
            );
            const eventsList = eventResponse.events ?? eventResponse ?? [];

            nextEvents[job.review_job_id] = eventsList;
            nextCursor[job.review_job_id] = eventsList.length
              ? eventsList[eventsList.length - 1].event_id
              : after;
          })
        );

        if (cancelled) return;

        setJobEvents((current) => {
          const merged = { ...current };
          Object.entries(nextEvents).forEach(([jobId, eventsList]) => {
            merged[jobId] = [...(current[jobId] ?? []), ...eventsList];
          });
          return merged;
        });
        setJobEventCursor((current) => ({ ...current, ...nextCursor }));
      } catch (error) {
        if (!cancelled) {
          setRequestError(error instanceof Error ? error.message : String(error));
        }
      }
    }

    syncBatch();
    const interval = window.setInterval(syncBatch, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [apiConfig, batchResponse?.batch_id, jobEventCursor]);

  const eventSubmissions = useMemo(
    () => submissions.filter((submission) => submission.eventId === draft.event_id),
    [draft.event_id, submissions]
  );

  const effectiveSelectedIds = useMemo(() => {
    const allowedIds = new Set(eventSubmissions.map((submission) => submission.id));
    const retained = selectedIds.filter((id) => allowedIds.has(id));
    return retained.length > 0 ? retained : eventSubmissions.map((submission) => submission.id);
  }, [eventSubmissions, selectedIds]);

  const selectedSubmissions = useMemo(
    () => eventSubmissions.filter((submission) => effectiveSelectedIds.includes(submission.id)),
    [effectiveSelectedIds, eventSubmissions]
  );

  const payload = useMemo(
    () => buildCreateReviewBatchPayload(draft, selectedSubmissions),
    [draft, selectedSubmissions]
  );

  async function handleSubmitBatch() {
    const errors = validateCreateReviewBatchPayload(payload);
    setValidationErrors(errors);
    setRequestError("");
    if (errors.length > 0) return;

    try {
      setRequestState("submitting");
      const response = await createReviewBatch(apiConfig, payload);
      setBatchResponse(response);
      setBatchDetails(null);
      setJobDetails({});
      setJobEvents({});
      setJobEventCursor({});
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    } finally {
      setRequestState("idle");
    }
  }

  async function handleFinalizeBatch() {
    if (!batchResponse?.batch_id) return;
    setRequestError("");

    try {
      await finalizeReviewBatch(apiConfig, batchResponse.batch_id);
      const batch = await getReviewBatch(apiConfig, batchResponse.batch_id);
      setBatchDetails(batch);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleRetryJob(reviewJobId) {
    setRequestError("");

    try {
      await retryReviewJob(apiConfig, reviewJobId);
      if (batchResponse?.batch_id) {
        const batch = await getReviewBatch(apiConfig, batchResponse.batch_id);
        setBatchDetails(batch);
      }
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleLoadArtifacts() {
    if (!batchResponse?.batch_id) return;
    setArtifactState("loading");
    setRequestError("");

    try {
      const response = await listArtifacts(apiConfig, {
        batch_id: batchResponse.batch_id,
        limit: 100,
      });
      setArtifacts(response.artifacts ?? []);
      setArtifactState("idle");
    } catch (error) {
      setArtifactState("idle");
      setRequestError(error instanceof Error ? error.message : String(error));
    }
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function updateEventId(value) {
    setDraft((current) => ({ ...current, event_id: value }));
    const nextSelection = submissions
      .filter((submission) => submission.eventId === value)
      .map((submission) => submission.id);
    setSelectedIds(nextSelection);
  }

  function updateTemplate(field, value) {
    setDraft((current) => ({
      ...current,
      template: { ...current.template, [field]: value },
    }));
  }

  function updateCriterion(index, field, value) {
    setDraft((current) => ({
      ...current,
      template: {
        ...current.template,
        criteria: current.template.criteria.map((criterion, criterionIndex) =>
          criterionIndex === index ? { ...criterion, [field]: value } : criterion
        ),
      },
    }));
  }

  function addCriterion() {
    setDraft((current) => ({
      ...current,
      template: {
        ...current.template,
        criteria: [
          ...current.template.criteria,
          {
            key: "",
            label: "",
            weight: "0",
            min_score: "0",
            max_score: "10",
            judge_role: "",
            instructions: "",
          },
        ],
      },
    }));
  }

  function removeCriterion(index) {
    setDraft((current) => ({
      ...current,
      template: {
        ...current.template,
        criteria: current.template.criteria.filter((_, criterionIndex) => criterionIndex !== index),
      },
    }));
  }

  function toggleSubmission(id) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  }

  return (
    <div className="mx-auto flex max-w-content flex-col gap-8 px-6 py-10 md:py-14">
      <div
        className="rounded-[32px] border border-border-subtle p-8 shadow-[0_24px_70px_-48px_rgba(22,34,49,0.35)]"
        style={{
          backgroundImage: "linear-gradient(180deg, var(--surface-card), var(--surface-elevated))",
        }}
      >
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-text-muted">
            Admin mode
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.04em] text-text-bright">
            Review batch console
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-text-secondary">
            Build the API payload, send it to Judge Console, then watch batch,
            job, and artifact state without the local simulator.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-border-subtle bg-surface-card p-6 shadow-[0_18px_55px_-44px_rgba(22,34,49,0.35)]">
          <div className="flex flex-col gap-5">
            <div className="inline-flex rounded-full bg-surface-elevated p-1">
              <button
                type="button"
                onClick={() => setAdminTab("inputs")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  adminTab === "inputs"
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Inputs
              </button>
              <button
                type="button"
                onClick={() => setAdminTab("payload")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  adminTab === "payload"
                    ? "bg-white text-text-primary shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Payload
              </button>
            </div>

            {adminTab === "inputs" ? (
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="base-url">API base URL</Label>
                    <Input
                      id="base-url"
                      value={apiConfig.baseUrl}
                      onChange={(event) =>
                        setApiConfig((current) => ({ ...current, baseUrl: event.target.value }))
                      }
                      className="h-12 rounded-2xl border-border-subtle bg-surface-elevated text-text-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="token">Organizer token</Label>
                    <Input
                      id="token"
                      type="password"
                      value={apiConfig.token}
                      onChange={(event) =>
                        setApiConfig((current) => ({ ...current, token: event.target.value }))
                      }
                      placeholder="Required to send requests"
                      className="h-12 rounded-2xl border-border-subtle bg-surface-elevated text-text-primary"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-mode">Auth mode</Label>
                  <select
                    id="auth-mode"
                    value={apiConfig.authMode}
                    onChange={(event) =>
                      setApiConfig((current) => ({ ...current, authMode: event.target.value }))
                    }
                    className={selectClassName()}
                  >
                    <option value="basic">Browser console Basic auth</option>
                    <option value="bearer">Direct Bearer auth</option>
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="tenant-id">Tenant ID</Label>
                    <Input
                      id="tenant-id"
                      value={draft.tenant_id}
                      onChange={(event) => updateDraft("tenant_id", event.target.value)}
                      className="h-12 rounded-2xl border-border-subtle bg-surface-elevated text-text-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event-id">Event ID</Label>
                    <select
                      id="event-id"
                      value={draft.event_id}
                      onChange={(event) => updateEventId(event.target.value)}
                      className={selectClassName()}
                    >
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="review-mode">Review mode</Label>
                    <select
                      id="review-mode"
                      value={draft.review_mode}
                      onChange={(event) => updateDraft("review_mode", event.target.value)}
                      className={selectClassName()}
                    >
                      {REVIEW_MODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="browser-mode">Browser mode</Label>
                    <select
                      id="browser-mode"
                      value={draft.browser_mode}
                      onChange={(event) => updateDraft("browser_mode", event.target.value)}
                      className={selectClassName()}
                    >
                      {BROWSER_MODE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-[24px] border border-border bg-surface-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Template</h2>
                      <p className="text-sm text-muted-foreground">
                        Keep it flat. Make the outgoing schema valid first.
                      </p>
                    </div>
                    <Button type="button" onClick={addCriterion} variant="secondary">
                      Add Criterion
                    </Button>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="template-id">Template ID</Label>
                      <Input
                        id="template-id"
                        value={draft.template.template_id}
                        onChange={(event) => updateTemplate("template_id", event.target.value)}
                        className="h-12 rounded-2xl border-white bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="template-version">Version</Label>
                      <Input
                        id="template-version"
                        value={draft.template.version}
                        onChange={(event) => updateTemplate("version", event.target.value)}
                        className="h-12 rounded-2xl border-white bg-white"
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-4">
                    {draft.template.criteria.map((criterion, index) => (
                      <div
                        key={`${criterion.key || "criterion"}-${index}`}
                        className="rounded-[22px] border border-border bg-white p-4"
                      >
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="flex min-w-0 flex-col gap-2">
                            <Label>Key</Label>
                            <Input
                              value={criterion.key}
                              onChange={(event) => updateCriterion(index, "key", event.target.value)}
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-2">
                            <Label>Label</Label>
                            <Input
                              value={criterion.label}
                              onChange={(event) =>
                                updateCriterion(index, "label", event.target.value)
                              }
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-2">
                            <Label>Weight</Label>
                            <Input
                              value={criterion.weight}
                              onChange={(event) =>
                                updateCriterion(index, "weight", event.target.value)
                              }
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-2">
                            <Label>Judge role</Label>
                            <Input
                              value={criterion.judge_role}
                              onChange={(event) =>
                                updateCriterion(index, "judge_role", event.target.value)
                              }
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[0.8fr_0.8fr_1.5fr_auto]">
                          <div className="flex min-w-0 flex-col gap-2">
                            <Label>Min score</Label>
                            <Input
                              value={criterion.min_score}
                              onChange={(event) =>
                                updateCriterion(index, "min_score", event.target.value)
                              }
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-2">
                            <Label>Max score</Label>
                            <Input
                              value={criterion.max_score}
                              onChange={(event) =>
                                updateCriterion(index, "max_score", event.target.value)
                              }
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                          <div className="flex min-w-0 flex-col gap-2 xl:col-span-1">
                            <Label>Instructions</Label>
                            <Input
                              value={criterion.instructions}
                              onChange={(event) =>
                                updateCriterion(index, "instructions", event.target.value)
                              }
                              className="h-11 rounded-2xl border-neutral-200 bg-neutral-50"
                            />
                          </div>
                          <div className="flex items-end sm:col-span-2 xl:col-span-1">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => removeCriterion(index)}
                              disabled={draft.template.criteria.length === 1}
                              className="w-full xl:w-auto"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[24px] border border-border bg-surface-card p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-semibold text-text-primary">Submissions</h2>
                      <p className="text-sm text-muted-foreground">
                        Select rows to freeze into the outgoing snapshot.
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedSubmissions.length} selected
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col divide-y divide-border overflow-hidden rounded-[20px] border border-border bg-white">
                    {eventSubmissions.map((submission) => (
                      <label
                        key={submission.id}
                        className="grid cursor-pointer gap-3 px-4 py-4 md:grid-cols-[auto_1.1fr_1fr]"
                      >
                        <input
                          type="checkbox"
                          checked={effectiveSelectedIds.includes(submission.id)}
                          onChange={() => toggleSubmission(submission.id)}
                          className="mt-1 size-4"
                        />
                        <div className="min-w-0">
                          <div className="font-medium text-text-primary">{submission.name}</div>
                          <div className="mt-1 font-mono text-xs text-muted-foreground">
                            {submission.id}
                          </div>
                        </div>
                        <div className="min-w-0 text-sm text-muted-foreground">
                          <div className="truncate">{submission.productUrl}</div>
                          <div className="mt-1 line-clamp-2">{submission.instructions}</div>
                        </div>
                      </label>
                    ))}
                    {eventSubmissions.length === 0 ? (
                      <div className="px-4 py-5 text-sm text-muted-foreground">
                        No submissions found for this event.
                      </div>
                    ) : null}
                  </div>
                </div>

                {validationErrors.length > 0 ? (
                  <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    {validationErrors.map((error) => (
                      <div key={error}>{error}</div>
                    ))}
                  </div>
                ) : null}

                {requestError ? (
                  <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    {requestError}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={handleSubmitBatch}
                    disabled={requestState === "submitting"}
                    className="rounded-full px-6"
                  >
                    {requestState === "submitting" ? "Submitting..." : "Create Review Batch"}
                  </Button>
                  {batchResponse?.batch_id ? (
                    <>
                      <Button type="button" variant="secondary" onClick={handleFinalizeBatch}>
                        Finalize Batch
                      </Button>
                      <Button type="button" variant="secondary" onClick={handleLoadArtifacts}>
                        {artifactState === "loading" ? "Loading Artifacts..." : "Load Artifacts"}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-[24px] border border-border bg-neutral-950 p-5 text-white">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/55">
                  Payload preview
                </div>
                <pre className="mt-4 overflow-x-auto rounded-[20px] bg-white/6 p-4 text-xs leading-6 text-white/90">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-[0_18px_55px_-44px_rgba(22,34,49,0.35)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">Live batch</h2>
                <p className="text-sm text-muted-foreground">
                  Polling starts after a batch is created.
                </p>
              </div>
              {batchResponse?.batch_id ? (
                <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-800">
                  {batchResponse.batch_id}
                </span>
              ) : null}
            </div>

            {!batchResponse?.batch_id ? (
              <div className="mt-5">
                <EmptyState
                  title="No batch yet"
                  copy="Create a review batch first. This panel will switch to server state."
                />
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-5">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-[20px] border border-border bg-surface-card px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Jobs returned
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-text-primary">
                      {batchDetails?.review_jobs?.length ?? batchResponse.review_jobs?.length ?? 0}
                    </div>
                  </div>
                  <div className="rounded-[20px] border border-border bg-surface-card px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Results
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-text-primary">
                      {batchDetails?.results?.length ?? 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {(batchDetails?.review_jobs ?? batchResponse.review_jobs ?? []).map((job) => {
                    const liveJob = jobDetails[job.review_job_id] ?? job;
                    const eventsList = jobEvents[job.review_job_id] ?? [];

                    return (
                      <div
                        key={job.review_job_id}
                        className="rounded-[20px] border border-border bg-white p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="font-medium text-text-primary">
                              {liveJob.submission_id ?? job.submission_id}
                            </div>
                            <div className="mt-1 font-mono text-xs text-muted-foreground">
                              {job.review_job_id}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(
                                liveJob.status
                              )}`}
                            >
                              {liveJob.status}
                            </span>
                            {liveJob.status === "failed" ? (
                              <Button
                                type="button"
                                variant="secondary"
                                onClick={() => handleRetryJob(job.review_job_id)}
                              >
                                Retry
                              </Button>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-3 text-sm text-muted-foreground">
                          Progress {liveJob.progress_percent ?? 0}%
                        </div>

                        {eventsList.length > 0 ? (
                          <div className="mt-3 rounded-[16px] bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
                            {eventsList.slice(-4).map((event) => (
                              <div key={`${job.review_job_id}-${event.event_id}`}>
                                {event.message || event.status}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {batchDetails?.results?.length ? (
                  <div className="rounded-[20px] border border-border bg-surface-card p-4">
                    <div className="text-sm font-semibold text-text-primary">Results</div>
                    <div className="mt-3 flex flex-col divide-y divide-border rounded-[16px] border border-border bg-white">
                      {batchDetails.results.map((result) => (
                        <div
                          key={result.review_job_id}
                          className="flex items-center justify-between gap-4 px-4 py-3"
                        >
                          <div>
                            <div className="font-medium text-text-primary">
                              #{result.rank ?? "-"} {result.submission_id}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {result.eligible ? "Eligible" : result.ineligibility_reason || "Ineligible"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-semibold text-text-primary">
                              {result.total_score ?? "-"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {result.confidence ?? "pending"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {artifacts.length > 0 ? (
                  <div className="rounded-[20px] border border-border bg-surface-card p-4">
                    <div className="text-sm font-semibold text-text-primary">Artifacts</div>
                    <div className="mt-3 flex flex-col divide-y divide-border rounded-[16px] border border-border bg-white">
                      {artifacts.map((artifact) => (
                        <div
                          key={artifact.artifact_id}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div>
                            <div className="font-medium text-text-primary">{artifact.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {artifact.artifact_type} · {artifact.artifact_id}
                            </div>
                          </div>
                          <a
                            href={
                              artifact.content_url?.startsWith("/")
                                ? `${apiConfig.baseUrl}${artifact.content_url}`
                                : artifact.content_url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-accent-700 underline"
                          >
                            Open
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
