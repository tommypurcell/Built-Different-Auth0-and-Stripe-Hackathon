// Same-origin proxy for the judge-console API. The browser cannot call the
// upstream host directly (no CORS headers), so the client points at /api/judge
// and this route forwards each request server-side, where CORS does not apply.
//
// The upstream host is fixed server-side via JUDGE_UPSTREAM_URL and is never
// exposed to or overridable by the browser.

const DEFAULT_UPSTREAM_URL = "https://cdn.auth0.saleehk.com";

// Request/response headers we must not blindly forward. Hop-by-hop headers and
// host-specific headers would corrupt the proxied request/response.
const STRIPPED_REQUEST_HEADERS = new Set([
  "host",
  "connection",
  "content-length",
  "origin",
  "referer",
]);
const STRIPPED_RESPONSE_HEADERS = new Set([
  "content-encoding",
  "content-length",
  "transfer-encoding",
  "connection",
]);

function getUpstreamBase() {
  return (process.env.JUDGE_UPSTREAM_URL ?? DEFAULT_UPSTREAM_URL).replace(/\/$/, "");
}

async function handle(request, context) {
  const { path } = await context.params;
  const segments = Array.isArray(path) ? path : path ? [path] : [];
  const search = new URL(request.url).search;
  const upstreamUrl = `${getUpstreamBase()}/${segments.map(encodeURIComponent).join("/")}${search}`;

  const headers = new Headers();
  for (const [key, value] of request.headers) {
    if (!STRIPPED_REQUEST_HEADERS.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  // Demo fallback: keep the organizer password server-side so the admin UI
  // does not need to collect or persist it in the browser.
  if (!headers.has("authorization") && process.env.JUDGE_API_PASSWORD) {
    const encoded = Buffer.from(`admin:${process.env.JUDGE_API_PASSWORD}`).toString("base64");
    headers.set("authorization", `Basic ${encoded}`);
  }

  const method = request.method.toUpperCase();
  const hasBody = method !== "GET" && method !== "HEAD";

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstreamUrl, {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
    });
  } catch (error) {
    return Response.json(
      { error: `Upstream request failed: ${error.message}` },
      { status: 502 }
    );
  }

  const responseHeaders = new Headers();
  for (const [key, value] of upstreamResponse.headers) {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) {
      responseHeaders.set(key, value);
    }
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
