const STRIPE_API = "https://api.stripe.com/v1";

export async function GET(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "STRIPE_SECRET_KEY is not configured." }, { status: 500 });
  }
  const sessionId = new URL(request.url).searchParams.get("session_id");
  if (!sessionId) return Response.json({ error: "Missing session_id." }, { status: 400 });

  const response = await fetch(`${STRIPE_API}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  const session = await response.json();
  if (!response.ok) return Response.json({ error: session.error?.message || "Unable to verify payment." }, { status: response.status });
  if (session.payment_status !== "paid") return Response.json({ error: "Payment was not completed." }, { status: 402 });

  return Response.json({ paid: true, submission: session.metadata });
}
