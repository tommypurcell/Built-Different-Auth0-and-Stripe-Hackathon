const DEFAULT_BASE_URL = "https://cdn.auth0.saleehk.com";

export const REVIEW_MODE_OPTIONS = ["quick", "full"];
export const BROWSER_MODE_OPTIONS = ["headless", "headed"];

export const DEFAULT_TEMPLATE = {
  template_id: "general-product-v1",
  version: "1",
  criteria: [
    {
      key: "product_flow",
      label: "Product flow",
      weight: "0.5",
      min_score: "0",
      max_score: "10",
      judge_role: "product",
      instructions: "Assess the instructed primary journey.",
    },
    {
      key: "idea",
      label: "Idea",
      weight: "0.5",
      min_score: "0",
      max_score: "10",
      judge_role: "idea",
      instructions: "Assess clarity, usefulness, and differentiation.",
    },
  ],
};

export const DEFAULT_BATCH_DRAFT = {
  tenant_id: "partner-demo",
  event_id: "event-2026",
  review_mode: "quick",
  browser_mode: "headless",
  template: DEFAULT_TEMPLATE,
};

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildSubmissionSnapshot(submission) {
  return {
    submission_id: submission.id,
    product_url: submission.productUrl,
    test_instructions: submission.instructions ?? "",
  };
}

export function buildCreateReviewBatchPayload(draft, submissions) {
  return {
    tenant_id: draft.tenant_id.trim(),
    event_id: draft.event_id.trim(),
    review_mode: draft.review_mode,
    browser_mode: draft.browser_mode,
    template: {
      template_id: draft.template.template_id.trim(),
      version: draft.template.version.trim(),
      criteria: draft.template.criteria.map((criterion) => ({
        key: criterion.key.trim(),
        label: criterion.label.trim(),
        weight: toNumber(criterion.weight),
        min_score: toNumber(criterion.min_score),
        max_score: toNumber(criterion.max_score),
        judge_role: criterion.judge_role.trim(),
        instructions: criterion.instructions.trim(),
      })),
    },
    submissions: submissions.map(buildSubmissionSnapshot),
  };
}

export function validateCreateReviewBatchPayload(payload) {
  const errors = [];

  if (!payload.tenant_id) errors.push("tenant_id is required.");
  if (!payload.event_id) errors.push("event_id is required.");
  if (!REVIEW_MODE_OPTIONS.includes(payload.review_mode)) {
    errors.push("review_mode must be quick or full.");
  }
  if (!BROWSER_MODE_OPTIONS.includes(payload.browser_mode)) {
    errors.push("browser_mode must be headless or headed.");
  }
  if (!payload.template.template_id) errors.push("template.template_id is required.");
  if (!payload.template.version) errors.push("template.version is required.");
  if (payload.template.criteria.length === 0) {
    errors.push("At least one template criterion is required.");
  }

  payload.template.criteria.forEach((criterion, index) => {
    if (!criterion.key) errors.push(`criteria[${index}].key is required.`);
    if (!criterion.label) errors.push(`criteria[${index}].label is required.`);
    if (!criterion.judge_role) errors.push(`criteria[${index}].judge_role is required.`);
    if (!criterion.instructions) errors.push(`criteria[${index}].instructions is required.`);
    if (criterion.weight == null) errors.push(`criteria[${index}].weight must be numeric.`);
    if (criterion.min_score == null) errors.push(`criteria[${index}].min_score must be numeric.`);
    if (criterion.max_score == null) errors.push(`criteria[${index}].max_score must be numeric.`);
  });

  if (payload.submissions.length === 0) {
    errors.push("Select at least one submission.");
  }

  payload.submissions.forEach((submission, index) => {
    if (!submission.submission_id) {
      errors.push(`submissions[${index}].submission_id is required.`);
    }
    if (!/^https?:\/\//.test(submission.product_url)) {
      errors.push(`submissions[${index}].product_url must start with http:// or https://.`);
    }
  });

  return errors;
}

function buildAuthHeader(token, authMode) {
  if (!token) return null;
  if (authMode === "basic") {
    return `Basic ${btoa(`admin:${token}`)}`;
  }
  return `Bearer ${token}`;
}

async function apiRequest(baseUrl, path, { method = "GET", token, authMode = "basic", body } = {}) {
  const headers = { Accept: "application/json" };
  const authHeader = buildAuthHeader(token, authMode);

  if (authHeader) headers.Authorization = authHeader;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "string"
        ? data
        : data?.error ?? `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return data;
}

export function getDefaultApiConfig() {
  return {
    baseUrl: DEFAULT_BASE_URL,
    token: "",
    authMode: "basic",
  };
}

export function createReviewBatch(apiConfig, payload) {
  return apiRequest(apiConfig.baseUrl, "/v1/review-batches", {
    method: "POST",
    token: apiConfig.token,
    authMode: apiConfig.authMode,
    body: payload,
  });
}

export function getReviewBatch(apiConfig, batchId) {
  return apiRequest(apiConfig.baseUrl, `/v1/review-batches/${batchId}`, {
    token: apiConfig.token,
    authMode: apiConfig.authMode,
  });
}

export function getReviewJob(apiConfig, reviewJobId) {
  return apiRequest(apiConfig.baseUrl, `/v1/review-jobs/${reviewJobId}`, {
    token: apiConfig.token,
    authMode: apiConfig.authMode,
  });
}

export function getReviewJobEvents(apiConfig, reviewJobId, after = 0) {
  return apiRequest(
    apiConfig.baseUrl,
    `/v1/review-jobs/${reviewJobId}/events?after=${after}`,
    {
      token: apiConfig.token,
      authMode: apiConfig.authMode,
    }
  );
}

export function finalizeReviewBatch(apiConfig, batchId) {
  return apiRequest(apiConfig.baseUrl, `/v1/review-batches/${batchId}/finalize`, {
    method: "POST",
    token: apiConfig.token,
    authMode: apiConfig.authMode,
  });
}

export function retryReviewJob(apiConfig, reviewJobId) {
  return apiRequest(apiConfig.baseUrl, `/v1/review-jobs/${reviewJobId}/retry`, {
    method: "POST",
    token: apiConfig.token,
    authMode: apiConfig.authMode,
  });
}

export function listArtifacts(apiConfig, query = {}) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiRequest(apiConfig.baseUrl, `/v1/artifacts${suffix}`, {
    token: apiConfig.token,
    authMode: apiConfig.authMode,
  });
}
