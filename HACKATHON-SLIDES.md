# Built Different: Auth0 × Stripe Hackathon

> Repository reference for the event, challenge requirements, Stripe Projects, architecture decisions, demo priorities, and day-of logistics.

## Source Note

The two shared Google Slides URLs point to the same published presentation:

- [Published deck](https://docs.google.com/presentation/d/e/2PACX-1vT0YQssUBVQWPPlNbp9XyeT9r-JqleIz9bx8fCSvuhVGb5EnSaIZF3p2cJa4t6FGt7MNRYx9aw8FRQC/pub?start=false&loop=false&delayms=3000)
- [Published deck with starting-slide anchor](https://docs.google.com/presentation/d/e/2PACX-1vT0YQssUBVQWPPlNbp9XyeT9r-JqleIz9bx8fCSvuhVGb5EnSaIZF3p2cJa4t6FGt7MNRYx9aw8FRQC/pub?start=false&loop=false&delayms=3000&slide=id.p)

The second URL does not appear to be a separate presentation. It adds `slide=id.p`, which selects a starting slide.

The published Google Slides endpoint did not expose the complete slide text for extraction. This document therefore consolidates:

1. The official event information.
2. Organizer announcements.
3. The Stripe Projects material supplied with the event.
4. Practical implementation conclusions for the repository.

---

## Event

**Name:** Built Different: Auth0 × Stripe Hackathon  
**Date:** Thursday, July 30, 2026  
**Time:** 12:00 PM–7:30 PM PDT  
**Format:** In person only  
**Age requirement:** 21+  
**Registration:** Approved attendees only  
**Status:** Event is at capacity

### Location

**Okta**  
100 1st St  
San Francisco, CA 94105

- Check in at the lobby.
- The address is listed with the sixth floor.
- The event itself takes place on the thirteenth floor.
- Government-issued identification is mandatory.
- Attendees without identification will not be admitted upstairs.

### Hosts

- Calah Vargas
- Shreya
- Fred Patton

Presented by **Auth0 Events – San Francisco**.

---

## Challenge

Build a:

> **Monetized, multi-user SaaS application from scratch using Stripe and Auth0.**

### Required Technologies

- **Auth0** for authentication and potentially organizations, roles, or B2B identity.
- **Stripe** for monetization and payment infrastructure.
- **Stripe Projects** for provisioning services and managing credentials through the CLI.

### Team Size

- One to three people.
- Solo participants are allowed.
- Teams may form during the opening session.

### What the wording implies

A project should visibly demonstrate all three of these:

1. More than one user or account.
2. A real authentication flow backed by Auth0.
3. A credible monetization flow backed by Stripe.

A single-user prototype with a decorative pricing page would satisfy the challenge poorly. The strongest submission will make identity, collaboration, permissions, and payment central to the product.

---

## Schedule

| Time | Activity |
|---|---|
| 12:00–12:30 PM | Lunch and coffee |
| 12:30–1:00 PM | Introductions, welcome, and team formation |
| 1:00–5:30 PM | Build session |
| 5:30–6:00 PM | Live project demos |
| 6:00–6:30 PM | Judge deliberation and happy hour |
| 6:30 PM | Winners announced |
| 7:30 PM | Event ends |

### Effective Build Window

The official hacking window is approximately **4.5 hours**.

That means the project should prioritize:

- One clear user journey.
- One functioning Auth0 login.
- One functioning Stripe payment or subscription flow.
- One obvious multi-user interaction.
- A polished demo path.
- Minimal infrastructure and no unnecessary features.

---

## Prizes

### First Place

- $2,000 Amazon gift card per team
- $3,000 in Stripe credits
- Auth0 B2B Pro for three months

### Second Place

- $1,000 Amazon gift card per team
- $2,000 in Stripe credits
- Auth0 B2B Pro for three months

### Third Place

- $500 Amazon gift card per team
- $1,000 in Stripe credits
- Auth0 B2B Pro for three months

---

## Judges

- **Mira Sharma** — AI Product Manager, Auth0
- **Siva Venugopal** — Staff Software Engineer, Stripe
- **Gabriela de Queiroz** — Founder and AI & Developer Relations Advisor, f02 labs
- **Adam O'Donnell** — Founder, The Founder Initiative
- **Karishma Mandal** — CEO and Founder, O1Assist

### Likely Evaluation Pressure

No formal judging rubric was included in the supplied event text. Based on the challenge and judging panel, a strong project should make the following immediately visible:

- Auth0 is essential rather than bolted on.
- Stripe is essential rather than simulated.
- The app supports multiple users or organizations.
- The monetization model makes sense.
- The demo works live.
- The product can be explained in one sentence.
- The team used Stripe Projects as part of the actual setup workflow.

Do not over-index on backend sophistication that cannot be shown during the demo.

---

# Stripe Projects

## What It Is

Stripe Projects is a CLI-based provisioning and credential-management layer for external software services.

Its core promise is:

> You install code with package managers. Stripe Projects provisions the external services that code depends on.

It is designed for both developers and coding agents.

### Basic Installation

```bash
brew install stripe/stripe-cli/stripe
stripe plugin install projects
```

### Core Commands

```bash
# Initialize a Stripe Projects configuration
stripe projects init

# View available providers and services
stripe projects catalog

# Provision a service
stripe projects add <provider>/<service>

# Upgrade a provider plan
stripe projects upgrade <provider>
```

Example:

```bash
stripe projects add auth0/<service>
stripe projects add neon/postgres
stripe projects add railway/<service>
```

The exact provider and service identifiers should be taken from:

```bash
stripe projects catalog
```

Do not guess the identifiers.

---

## What Stripe Projects Handles

Stripe Projects can help with:

- Provisioning third-party services.
- Creating resources in accounts the developer owns.
- Generating service credentials.
- Returning credentials to the local environment.
- Sharing setup details with coding agents.
- Reducing dashboard navigation.
- Managing supported provider subscriptions and plans.
- Keeping service setup auditable and repeatable.
- Making environment setup more portable between developers, machines, and agents.

## What It Does Not Handle

Stripe Projects does not write the application integration for you.

It does not automatically:

- Build Auth0 login pages.
- Protect routes.
- Implement roles or organizations.
- Create database tables.
- Write migrations.
- Build Stripe Checkout.
- Process Stripe webhooks.
- Implement subscription entitlements.
- Create the product UI.
- Guarantee production deployment.
- Replace provider-specific SDKs.

The coding agent can perform much of that work after provisioning, but the app still needs real integration code.

---

## Provider Responsibilities

| Service | Stripe Projects handles | Application still needs |
|---|---|---|
| Auth0 | Provisioning and credentials | Login, logout, sessions, route protection, roles, organizations |
| Stripe | Credentials and project access | Products, prices, Checkout, Billing Portal, webhooks, entitlements |
| Database | Database resource and connection credentials | Schema, migrations, queries, authorization |
| Hosting | Hosting resource and credentials | Build settings, deployment, production environment configuration |
| Monitoring | Project and credentials | SDK setup, instrumentation, alerts, error boundaries |
| AI provider | Account/service credentials | Prompts, application logic, safety controls, usage limits |

---

## Why Stripe Projects Matters at This Hackathon

The hackathon only provides a few hours of development time. Service setup normally creates friction through:

- Creating accounts.
- Navigating several dashboards.
- Copying API keys.
- Configuring environment variables.
- Selecting plans.
- Connecting services.
- Repeating setup for teammates or agents.

Stripe Projects is meant to compress that setup into deterministic CLI commands.

That gives the team more time for:

- Product design.
- Authenticated flows.
- Payments.
- Multi-user behavior.
- Demo polish.

The judges will likely expect teams to use Stripe Projects as more than a name-drop. The repository should preserve the commands or setup record used to provision the stack.

---

# Recommended Architecture

## Minimal Stack

A defensible hackathon stack is:

- **Next.js** for the web application.
- **Auth0** for authentication.
- **Stripe Billing or Checkout** for monetization.
- **Postgres** for application data.
- **Vercel or Railway** for deployment.
- **Stripe Projects** for provisioning supported services.

## Core Data Model

At minimum:

### User

```text
id
auth0_user_id
email
name
created_at
```

### Organization or Team

```text
id
name
owner_user_id
stripe_customer_id
subscription_status
created_at
```

### Membership

```text
id
organization_id
user_id
role
created_at
```

### Product-Specific Record

For an event-submission product:

```text
submission
review_job
scorecard
ranking
```

The exact schema depends on the chosen application, but users, organizations, memberships, and billing state are the reusable SaaS foundation.

---

## Authentication Flow

1. User selects **Log in**.
2. Auth0 authenticates the user.
3. The application receives a validated session.
4. The application creates or updates its local user record.
5. Protected routes require the authenticated session.
6. Organization membership determines access.
7. Sensitive API routes verify both identity and authorization.

Authentication answers:

> Who is this user?

Authorization answers:

> What is this user allowed to do?

The app needs both.

---

## Billing Flow

1. An authenticated user selects a paid plan.
2. The application creates or retrieves a Stripe customer.
3. The application starts Stripe Checkout.
4. Stripe completes payment.
5. A Stripe webhook reports the subscription state.
6. The application stores the billing state.
7. Product access is granted from webhook-confirmed state, not from the browser redirect alone.

### Important

Do not trust the success-page redirect as proof of payment. Use Stripe webhook events to update access.

---

# Suggested Repository Setup

## Root Files

```text
README.md
HACKATHON.md
.env.example
package.json
```

### Recommended Separation

- `README.md` — product explanation, setup, architecture, and demo.
- `HACKATHON.md` — event rules, schedule, prizes, judges, Stripe Projects notes, and logistics.
- `.env.example` — variable names only; no secrets.

## Environment Variables

A likely `.env.example` may include:

```bash
# Auth0
AUTH0_SECRET=
APP_BASE_URL=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=

# Database
DATABASE_URL=
```

Actual names depend on the current Auth0 and Stripe SDK versions and the generated provider instructions.

Never commit live credentials.

---

# Demo Strategy

## Ideal Demo Length

The official demo block is only thirty minutes for all teams. Assume each team receives only a few minutes.

## Demo Sequence

1. State the problem in one sentence.
2. Show a new user signing in with Auth0.
3. Show the user creating or joining a shared workspace.
4. Show a second-user or role-based interaction.
5. Show the paid action or subscription through Stripe.
6. Show the unlocked product capability.
7. Briefly show the Stripe Projects provisioning commands.
8. End with the concrete outcome.

## What Not to Demo

Avoid spending scarce time on:

- Installation.
- Long architecture explanations.
- Generic dashboards.
- Every feature.
- Code walkthroughs.
- Fake future-roadmap claims.
- Infrastructure that the user cannot see.

---

# Day-of Checklist

## Before Building

- [ ] Bring government-issued identification.
- [ ] Complete the registration email from `no-reply@zoom.us`.
- [ ] Arrive by 12:00 PM.
- [ ] Confirm access to GitHub.
- [ ] Confirm Stripe CLI installation.
- [ ] Confirm the Stripe Projects plugin installation.
- [ ] Confirm Node.js and package manager versions.
- [ ] Confirm Auth0 and Stripe account access.
- [ ] Create a clean repository.
- [ ] Add `.env` to `.gitignore`.
- [ ] Decide the exact one-sentence product pitch.

## During Building

- [ ] Initialize Stripe Projects.
- [ ] Inspect the provider catalog.
- [ ] Provision only necessary services.
- [ ] Save setup commands in repository documentation.
- [ ] Implement Auth0 first.
- [ ] Implement the core multi-user flow.
- [ ] Implement Stripe Checkout or subscription.
- [ ] Implement Stripe webhook handling.
- [ ] Deploy early.
- [ ] Test using a fresh browser session.
- [ ] Prepare seeded demo data.
- [ ] Prepare a fallback recording or screenshots where permitted.

## Before Demo

- [ ] Test login.
- [ ] Test logout.
- [ ] Test protected routes.
- [ ] Test the second-user flow.
- [ ] Test Stripe in test mode.
- [ ] Test webhook receipt.
- [ ] Test the deployed URL.
- [ ] Close unrelated tabs.
- [ ] Increase browser zoom if needed.
- [ ] Rehearse the full demo under the likely time limit.

---

# Organizer Announcements

## July 30, 2026

- Confirm office registration using the email from `no-reply@zoom.us`.
- Contact the organizers if the registration message was not received.
- Bring government-issued identification.
- Attendees without identification will not be allowed upstairs.
- Arrive ready to meet and form teams.

## July 29, 2026

- Arrive on time at 12:00 PM.
- Lunch and treats will be provided.
- Advance office registration is required.
- The event is at capacity.
- Only approved guests may enter.
- Participants unable to attend should update their RSVP.

## July 27, 2026

- Update the RSVP if no longer attending.
- The event is entirely in person.
- Organizers want to prioritize participants who can stay for the whole event.

---

# Food and Hospitality

The organizers are providing:

- Lunch
- Coffee
- Additional treats
- Happy hour

---

# Privacy, Conduct, and Photography

## Privacy

Personal information is collected by Auth0 and Okta for event administration. It may be processed and transferred internationally under Okta's privacy terms.

Privacy questions may be sent to:

```text
privacy@okta.com
```

## Code of Conduct

Attendance is subject to Okta's Events Code of Conduct.

## Photography

Filming and photography will take place for promotional and archival purposes. Images may appear on Auth0 or host websites and social-media accounts.

---

# Bottom Line

Stripe Projects is not the application backend and it is not an automatic integration engine.

It is the provisioning layer that helps a developer or coding agent:

1. Create external services.
2. Obtain real credentials.
3. Keep setup inside a CLI workflow.
4. Move faster without manually navigating several dashboards.

For this hackathon, the winning implementation should still visibly deliver:

- Real Auth0 authentication.
- Real multi-user behavior.
- Real Stripe monetization.
- A short, reliable demo.
- Clear evidence that Stripe Projects accelerated setup.
