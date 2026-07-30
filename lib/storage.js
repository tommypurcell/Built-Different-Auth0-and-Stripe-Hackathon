// Swappable data layer — every function is async and named like a table
// operation so the internals can be rewritten against Supabase later
// without changing any call site.

import { SEED_PROJECTS, SEED_EVENTS } from "./mock-data";

const KEYS = {
  submissions: "hj_submissions",
  reviewJobs: "hj_review_jobs",
  rankings: "hj_rankings",
  published: "hj_published",
};

function readTable(key) {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(key);
  return raw ? JSON.parse(raw) : [];
}

function writeTable(key, rows) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(rows));
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

// ---- events ----

export async function getEvents() {
  return SEED_EVENTS;
}

export async function getEvent(id) {
  return SEED_EVENTS.find((e) => e.id === id) ?? null;
}

// ---- submissions ----

export async function getSubmissions() {
  const stored = readTable(KEYS.submissions);
  const overrides = new Map(stored.map((s) => [s.id, s]));
  const seeds = SEED_PROJECTS.map((s) => overrides.get(s.id) ?? s);
  const extras = stored.filter((s) => !SEED_PROJECTS.some((seed) => seed.id === s.id));
  return [...seeds, ...extras];
}

export async function getSubmissionsForEvent(eventId) {
  const all = await getSubmissions();
  return all.filter((s) => s.eventId === eventId);
}

// The current user's own submissions — those created from this browser's
// Submit form (not the pre-seeded demo projects), newest first.
export async function getMySubmissions() {
  const stored = readTable(KEYS.submissions).filter(
    (s) => !SEED_PROJECTS.some((seed) => seed.id === s.id)
  );
  return stored.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export async function getSubmission(id) {
  const all = await getSubmissions();
  return all.find((s) => s.id === id) ?? null;
}

export async function createSubmission({
  name,
  productUrl,
  instructions,
  category,
  eventId,
}) {
  const submissions = readTable(KEYS.submissions);
  const record = {
    id: makeId("sub"),
    name,
    productUrl,
    instructions,
    category: category || "SaaS",
    eventId: eventId || SEED_EVENTS[0]?.id,
    status: "submitted",
    tagline: "Awaiting review",
    coverColor: "var(--accent-500)",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  writeTable(KEYS.submissions, [...submissions, record]);
  return record;
}

export async function updateSubmissionStatus(id, status) {
  const stored = readTable(KEYS.submissions);
  const isSeed = SEED_PROJECTS.some((s) => s.id === id);
  if (isSeed) {
    // Seed rows are read-only source data; mirror the status change as a
    // local override row so Discover reflects it without mutating the seed.
    const existing = stored.find((s) => s.id === id);
    const base = existing ?? SEED_PROJECTS.find((s) => s.id === id);
    const updated = { ...base, status, updatedAt: nowIso() };
    const next = existing
      ? stored.map((s) => (s.id === id ? updated : s))
      : [...stored, updated];
    writeTable(KEYS.submissions, next);
    return updated;
  }
  const next = stored.map((s) =>
    s.id === id ? { ...s, status, updatedAt: nowIso() } : s
  );
  writeTable(KEYS.submissions, next);
  return next.find((s) => s.id === id) ?? null;
}

// ---- review jobs ----

export async function getReviewJobs() {
  return readTable(KEYS.reviewJobs);
}

export async function getReviewJobForSubmission(submissionId) {
  const jobs = readTable(KEYS.reviewJobs);
  return jobs.find((j) => j.submissionId === submissionId) ?? null;
}

export async function createReviewJob({ submissionId }) {
  const jobs = readTable(KEYS.reviewJobs);
  const record = {
    id: makeId("review_job"),
    submissionId,
    status: "queued",
    score: null,
    feedback: null,
    startedAt: nowIso(),
    completedAt: null,
  };
  writeTable(KEYS.reviewJobs, [...jobs, record]);
  return record;
}

export async function updateReviewJob(id, patch) {
  const jobs = readTable(KEYS.reviewJobs);
  const next = jobs.map((j) => (j.id === id ? { ...j, ...patch } : j));
  writeTable(KEYS.reviewJobs, next);
  return next.find((j) => j.id === id) ?? null;
}

export async function clearReviewJobs() {
  writeTable(KEYS.reviewJobs, []);
}

// ---- rankings ----

export async function getRanking() {
  return readTable(KEYS.rankings);
}

export async function saveRanking(rankings) {
  writeTable(KEYS.rankings, rankings);
  return rankings;
}

// ---- publish state ----

export async function isPublished() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(KEYS.published) === "true";
}

export async function publishResults() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS.published, "true");
}
