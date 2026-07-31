# Independent AI Judge API Integration

## Purpose and boundary

Independent AI Judge reviews product submissions that already exist in a
partner event system. A batch snapshots stable submission IDs, product URLs,
test instructions, and a versioned generic rubric; the service then captures
evidence, runs specialist judges, and deterministically ranks eligible latest
attempts.

It does not create events, users, tickets, payments, or submission accounts.
There are no separate submit and start endpoints: creating a review batch both
submits the immutable snapshot and queues its review jobs.

## Base URL and authentication

The authenticated production service is:

```text
https://cdn.auth0.saleehk.com
```

Keep the URL and token in server-side configuration. For example:

```text
JUDGE_SERVICE_URL=https://cdn.auth0.saleehk.com
JUDGE_API_TOKEN=<secret supplied out of band>
```

API clients send the token as a Bearer credential on every request:

```http
Authorization: Bearer <service-token>
Content-Type: application/json
```

The browser console accepts the same secret through HTTP Basic authentication
with username `admin`. Never put the token in browser code, a URL, request
body, log, artifact, screenshot, source-control file, or public report. Do not
forward a user's Auth0 or application token to this service. The current
deployment uses one shared service credential; `tenant_id` does not scope
authorization. Call the Judge API only from the partner backend, over HTTPS,
and arrange token rotation out of band.

## IDs and core objects

- `tenant_id`: stable opaque partner namespace supplied by the partner.
- `event_id`: stable opaque event reference supplied by the partner.
- `submission_id`: stable opaque ID supplied by the partner. It must be unique
  within one batch.
- `template_id` plus `version`: identifies the partner rubric snapshot.
- `batch_id`: service-generated ID for one immutable event, rubric, and
  submission snapshot.
- `review_job_id`: service-generated ID for one judging attempt. A retry always
  creates a new ID and increments `attempt`.
- `artifact_id`: service-generated ID for one retained evidence or output
  artifact.

Persist `batch_id` and every returned `review_job_id`. Do not parse, shorten,
or recreate service-generated IDs. All IDs are organizer-private unless
explicitly approved for an internal integration.

## Endpoint inventory

Every route below requires the Bearer token in production:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Provider, browser, database, and worker readiness |
| `GET` | `/v1/review-batches?limit=20` | Recent batch summaries |
| `POST` | `/v1/review-batches` | Snapshot submissions and queue first attempts |
| `GET` | `/v1/review-batches/:batch_id` | Batch, jobs, rubric, and final results |
| `POST` | `/v1/review-batches/:batch_id/finalize` | Finalize terminal latest attempts |
| `DELETE` | `/v1/review-batches/:batch_id` | Permanently delete one terminal batch |
| `GET` | `/v1/review-jobs/:review_job_id` | Attempt, scores, judges, and artifacts |
| `GET` | `/v1/review-jobs/:review_job_id/events?after=0` | Incremental progress events |
| `POST` | `/v1/review-jobs/:review_job_id/retry` | Queue a new attempt |
| `GET` | `/v1/artifacts` | Filtered private artifact/gallery metadata |
| `GET` | `/v1/artifacts/:artifact_id` | One private artifact's metadata |
| `GET` | `/v1/artifacts/:artifact_id/content` | Original authenticated content |
| `GET` | `/v1/evidence/:artifact_id` | Compatibility artifact-content route |
| `GET` | `/v1/metrics` | Aggregate operations and availability metrics |

`GET /health` returns `status: "ok"` only when both the provider CLI and
browser are ready; otherwise it returns `status: "degraded"` plus component
states. A successful HTTP response alone is not proof that reviews can run.

## Create and start a review batch

`POST /v1/review-batches`

```json
{
  "tenant_id": "partner-demo",
  "event_id": "event-2026",
  "review_mode": "quick",
  "browser_mode": "headless",
  "template": {
    "template_id": "general-product-v1",
    "version": "1",
    "criteria": [
      {
        "key": "product_flow",
        "label": "Product flow",
        "weight": 0.5,
        "min_score": 0,
        "max_score": 10,
        "judge_role": "product",
        "instructions": "Assess the instructed primary journey."
      },
      {
        "key": "idea",
        "label": "Idea",
        "weight": 0.5,
        "min_score": 0,
        "max_score": 10,
        "judge_role": "idea",
        "instructions": "Assess clarity, usefulness, and differentiation."
      }
    ]
  },
  "submissions": [
    {
      "submission_id": "submission-001",
      "product_url": "https://product.example",
      "test_instructions": "Inspect the landing page and primary demo journey."
    }
  ]
}
```

The response is `202 Accepted`:

```json
{
  "batch_id": "batch_<generated>",
  "review_jobs": [
    {
      "review_job_id": "job_<generated>",
      "batch_id": "batch_<generated>",
      "submission_id": "submission-001",
      "attempt": 1,
      "review_mode": "quick",
      "browser_mode": "headless",
      "status": "queued",
      "progress_percent": 0
    }
  ]
}
```

Product URLs must use HTTP or HTTPS. Private, loopback, link-local, and other
local-network targets are rejected by default, including unsafe redirects.
Request constraints enforced by the service include 1–100 unique submissions,
1–50 uniquely keyed criteria, positive criterion weights, a maximum of 20,000
characters for each submission's test instructions, and a maximum of 10,000
characters for each criterion's instructions.

Creating the batch is also the start operation: there is no separate submission
or start endpoint. Batch status begins as `running`; one queued job is created
per submission.

## Quick Review and Full Review

`review_mode` is optional and defaults to `quick`.

- `quick`: optimized for a live demo. It has a 45-second evidence budget,
  inspects the landing page plus at most one primary journey, and permits up to
  2 browser actions, 2 observed pages, and 3 screenshots. Results are labeled
  `confidence: "limited"`.
- `full`: uses the extended configured evidence budget (6 actions and up to 12
  pages by default). Results are labeled `confidence: "standard"`, but remain
  bounded by the evidence actually captured.

`browser_mode` is independently `headless` (default) or `headed`. A retry
preserves both settings. Partner backends should normally request `headless`;
`headed` is intended for an operator watching the browser on the Judge host.

The `limited`/`standard` value on a final result describes the review mode.
Specialist `judge_runs` separately use `low`, `medium`, or `high` model
confidence; the two fields are not interchangeable.

## Poll progress, results, and ranking

List recent batches:

```http
GET /v1/review-batches?limit=20
```

`limit` defaults to 20 and must be from 1 through 100. Batch summaries include
the partner references, rubric identity, status, timestamps, job count, and
eligible-result count.

Get a batch, its jobs, immutable criterion snapshot, and final ranking when
available:

```http
GET /v1/review-batches/:batch_id
```

Get one attempt, including its private input snapshot, timing/error fields,
scores, specialist `judge_runs`, and artifact records:

```http
GET /v1/review-jobs/:review_job_id
```

Poll append-only attempt events:

```http
GET /v1/review-jobs/:review_job_id/events?after=0
```

Event records contain an increasing numeric `event_id`, `review_job_id`, status,
`progress_percent`, message, and timestamp. Pass the last observed event ID as
`after` to fetch only newer events. The lifecycle is:

```text
queued -> reviewing -> evidence -> judging -> complete
   \---------- any processing stage ----------> failed
```

The service implements polling only. It does not currently provide webhooks,
SSE, or callback registration. Treat both `complete` and `failed` as terminal.
The batch remains `running` until the latest attempt for every submission is
terminal and finalization succeeds; then its status is `complete`.

Once every latest attempt is terminal, the worker finalizes automatically and
`GET /v1/review-batches/:batch_id` includes `results` ordered by eligibility and
rank. Each result includes `submission_id`, latest `review_job_id`,
`eligible`, normalized weighted `total_score`, `rank`, criterion scores,
`review_mode`, `confidence`, and any ineligibility reason.

`total_score` is a deterministic 0–100 normalized weighted score. Only eligible
latest attempts are ranked. Higher scores rank first; equal scores are resolved
by ascending `submission_id`. Ineligible results have `total_score` and `rank`
set to `null`.

An organizer can also request finalization after all jobs are terminal:

```http
POST /v1/review-batches/:batch_id/finalize
```

It returns `409` while any latest attempt remains active. Calling it after all
latest attempts are terminal is safe and recomputes the deterministic results.

## Artifacts

List authenticated artifact metadata:

```http
GET /v1/artifacts?batch_id=<batch_id>&submission_id=<submission_id>&artifact_type=screenshot&limit=100
```

Supported optional filters are `batch_id`, `review_job_id`, `submission_id`,
and `artifact_type`; `limit` is 1–250.

```json
{
  "artifacts": [
    {
      "artifact_id": "artifact_<generated>",
      "artifact_type": "screenshot",
      "label": "Initial full-page landing-page capture",
      "review_job_id": "job_<generated>",
      "batch_id": "batch_<generated>",
      "submission_id": "submission-001",
      "attempt": 1,
      "timestamp": "2026-07-30T00:00:00.000Z",
      "content_type": "image/png",
      "size_bytes": 12345,
      "integrity": {
        "algorithm": "sha256",
        "hash": "<sha256>"
      },
      "metadata_url": "/v1/artifacts/artifact_<generated>",
      "content_url": "/v1/artifacts/artifact_<generated>/content"
    }
  ],
  "count": 1
}
```

Retrieve metadata or authenticated content:

```http
GET /v1/artifacts/:artifact_id
GET /v1/artifacts/:artifact_id/content
```

The compatibility content route `GET /v1/evidence/:artifact_id` remains
implemented. Artifact APIs never return internal filesystem paths. Content is
served with `Cache-Control: no-store`; unknown future content types download as
attachments rather than rendering inline.

The generic artifact types currently produced include `screenshot`, `metadata`,
`evidence_packet`, and `judge_reasoning`. Treat every artifact as
organizer-private. Evidence packets contain compact, concern-specific facts
routed to specialist judges. Judge reasoning contains structured scores,
specialist confidence, a concise rationale, limitations, supporting artifact
and packet references, timing, and provider/model/template provenance. It
intentionally excludes raw prompts, credentials, provider diagnostics, and raw
browser text.

Use the artifact list as the gallery feed. Use `content_url` only from an
authenticated backend or organizer session; do not proxy it into a public
gallery. Verify downloaded content against `integrity.hash` or the
`X-Content-SHA256` response header when artifact integrity matters.

## Operational metrics

Authenticated admin clients can retrieve compact, aggregate-only monitoring
data:

```http
GET /v1/metrics?window_hours=24
Authorization: Bearer <service-token>
```

`window_hours` is an integer from 1 through 168. Add `batch_id=<batch_id>` to
scope counts and summaries to one existing batch. The top-level response
contains `generated_at`, `window`, `current_states`, `totals`, `throughput`,
`timing`, `judges`, `artifacts`, and `availability`, including:

- current review state counts;
- submissions and review attempts split by Quick and Full mode;
- completed, failed, and retry-attempt counts;
- recent completion/failure throughput and directly bucketed trend data;
- queue-wait and end-to-end review-duration count, average, p50, p95, and max;
- aggregate per-judge counts, duration, prompt-character, and evidence-character
  summaries;
- artifact counts and total stored bytes by generic type; and
- coarse API, database, worker, provider, and browser availability states.

The endpoint never returns submission URLs, test instructions, credentials, raw
prompts or logs, artifact paths, or secret provider configuration.

## Delete one review run

Deletion is an organizer-only permanent cleanup operation. It is disabled when
`JUDGE_ADMIN_TOKEN` is not configured and refuses a batch with active jobs.
Send the selected batch ID both in the path and in the confirmation header:

```http
DELETE /v1/review-batches/:batch_id
Authorization: Bearer <service-token>
X-Confirm-Batch-ID: <same-batch_id>
```

A successful first request returns:

```json
{
  "deleted": true,
  "already_deleted": false,
  "tombstone": {
    "batch_id": "batch_<generated>",
    "deletion_id": "delete_<generated>",
    "deleted_at": "2026-07-30T00:00:00.000Z",
    "job_count": 2,
    "artifact_count": 20,
    "artifact_bytes": 162139,
    "cleanup_status": "complete",
    "cleanup_completed_at": "2026-07-30T00:00:01.000Z"
  }
}
```

The header comparison is exact and case-sensitive; this is the API equivalent
of typing the batch ID in the console. Repeating the same confirmed request is
safe and returns `200` with
`deleted: false` and `already_deleted: true`. The non-sensitive tombstone never
contains URLs, instructions, prompts, credentials, artifact paths, or model
output.

Deletion removes only the selected batch’s rubric/submission snapshots,
dependent jobs, events, scores, judge runs, rankings/results, evidence
metadata, and run-owned files. It also removes orphaned files inside that
batch's managed storage and removes the run's contribution from aggregate
metrics. This service has no shared source-template or
submission catalog; unrelated batches and external source records are
preserved. Storage paths are resolved against the managed data directory and
unsafe or cross-run artifact paths cause the operation to fail closed.

There is no bulk-delete or automatic-retention endpoint. After deletion, the
batch, its jobs, and its artifacts return `404`; only the non-sensitive
internal tombstone remains so an exact repeat can be answered idempotently.

## Errors, retries, and idempotency

Errors use JSON such as:

```json
{ "error": "not_found" }
```

Some validation responses also include `detail` or Zod `issues`. Clients should
branch on the HTTP status and stable `error` code, not the human-readable text.
Implemented cases include:

- `400`: invalid request, cursor, limit, unsafe product URL, or missing/mismatched
  delete confirmation.
- `401`: authentication required.
- `403`: cross-site or rejected browser origin.
- `404`: unknown batch, job, or artifact.
- `409`: finalization or deletion requested while jobs remain active.
- `422`: deletion storage scope failed secure validation.
- `503`: permanent deletion requested without configured organizer auth.
- `500`: internal error.

Retry a failed attempt:

```http
POST /v1/review-jobs/:review_job_id/retry
```

The response is `202 Accepted` with a new `review_job_id` and incremented
attempt. Prior attempts and artifacts remain retained, the batch returns to
`running`, and previous final results are cleared until re-finalization. The
route technically accepts any existing attempt; partner backends should expose
it only as an explicit retry of a `failed` attempt.

Batch creation and retry do not currently accept idempotency keys. Do not
automatically replay a POST after an ambiguous timeout: first reconcile by
listing recent batches and matching the partner's `tenant_id`, `event_id`, and
known submission IDs. A confirmed delete is the one idempotent mutation because
the service retains a non-sensitive tombstone.

## Minimal end-to-end backend example

This Node/TypeScript example creates a Quick Review, polls the batch, and lists
its private gallery metadata. It reads configuration from the backend
environment and never sends the token to a browser:

```ts
const baseUrl =
  process.env.JUDGE_SERVICE_URL ?? "https://cdn.auth0.saleehk.com";
const token = process.env.JUDGE_API_TOKEN;
if (!token) throw new Error("JUDGE_API_TOKEN is required");

async function judgeRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(new URL(path, baseUrl), {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...init.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Judge API ${response.status}: ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

type Job = {
  review_job_id: string;
  submission_id: string;
  status: "queued" | "reviewing" | "evidence" | "judging" | "complete" | "failed";
};
type Result = {
  submission_id: string;
  review_job_id: string;
  eligible: boolean;
  total_score: number | null;
  rank: number | null;
};
type Batch = {
  batch_id: string;
  status: "running" | "complete";
  jobs: Job[];
  results: Result[];
};

const created = await judgeRequest<{ batch_id: string; review_jobs: Job[] }>(
  "/v1/review-batches",
  {
    method: "POST",
    body: JSON.stringify({
      tenant_id: "partner-production",
      event_id: "hackathon-2026",
      review_mode: "quick",
      browser_mode: "headless",
      template: {
        template_id: "product-v1",
        version: "1",
        criteria: [{
          key: "product",
          label: "Product",
          weight: 1,
          min_score: 0,
          max_score: 10,
          judge_role: "product",
          instructions: "Assess the instructed product journey."
        }]
      },
      submissions: [{
        submission_id: "submission-001",
        product_url: "https://product.example",
        test_instructions: "Inspect the landing page and primary demo journey."
      }]
    })
  }
);

let batch: Batch;
for (;;) {
  batch = await judgeRequest<Batch>(
    `/v1/review-batches/${encodeURIComponent(created.batch_id)}`
  );
  if (batch.status === "complete") break;
  await new Promise((resolve) => setTimeout(resolve, 2_000));
}

const ranked = batch.results.filter((result) => result.eligible);
const gallery = await judgeRequest<{ artifacts: unknown[]; count: number }>(
  `/v1/artifacts?batch_id=${encodeURIComponent(batch.batch_id)}&limit=100`
);
console.log({ ranked, artifactCount: gallery.count });
```

For more granular progress, poll each returned job's
`/v1/review-jobs/:review_job_id/events?after=<last_event_id>` and persist the
largest event ID. If the latest attempt fails, retry it explicitly and replace
the partner's current job reference with the newly returned `review_job_id`.

## Privacy and public reporting

Organizer-private data includes product/test URLs, test instructions,
screenshots, journey metadata, job events and errors, model output, judge
explanations, evidence citations, IDs, hashes, metrics, and provider health
details. Use disposable scoped demo accounts; never place real
credentials, cookies, authorization headers, payment data, or signed URL query
strings in test instructions.

A public report should be created separately after organizer review and should
contain only intentionally public submission names, eligibility, rank,
aggregate score, approved high-level criterion summaries, rubric/version, and
non-sensitive timestamps. Do not expose artifacts or their direct metadata in a
public report. Screenshots may contain personal data or credentials even when
the metadata is redacted and therefore require human review before any
publication.
