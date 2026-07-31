const STRIPE_API = "https://api.stripe.com/v1";
const SUBMISSION_PRICE_CENTS = 500;

function stripeHeaders() {
  return {
    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    "Content-Type": "application/x-www-form-urlencoded",
  };
}

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: "STRIPE_SECRET_KEY is not configured." }, { status: 500 });
  }

  const body = await request.json();
  const { name, productUrl, instructions, eventId, eventName } = body;
  if (!name || !productUrl || !eventId) {
    return Response.json({ error: "Project name, product URL, and event are required." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "payment",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": String(SUBMISSION_PRICE_CENTS),
    "line_items[0][price_data][product_data][name]": "Hackathon project submission",
    "line_items[0][price_data][product_data][description]": eventName || "Event submission",
    "line_items[0][quantity]": "1",
    success_url: `${origin}/submit?checkout_session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/submit?payment=cancelled`,
    "metadata[name]": name,
    "metadata[productUrl]": productUrl,
    "metadata[instructions]": instructions || "",
    "metadata[eventId]": eventId,
  });

  const response = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: stripeHeaders(),
    body: form,
  });
  const session = await response.json();
  if (!response.ok) {
    return Response.json({ error: session.error?.message || "Stripe checkout failed." }, { status: response.status });
  }
  return Response.json({ url: session.url });
}
