# Setup Notes

Date: July 30, 2026

## Current status

The Stripe Projects setup for this repo is working.

Provisioned successfully:

- `auth0/free`
- `auth0/client`
- `supabase/free`
- `supabase/project`
- `vercel/hobby`
- `vercel/project`

Linked providers:

- Auth0
- Supabase
- Vercel

Active Stripe account:

- `Spartacus`
- `acct_1Tz1lL6H06iI1PJv`

Stripe Project:

- `Built-Different-Auth0-and-Stripe-Hackathon`
- `project_61V8PqILCgZ8QcdwT16V8Pih9cSQ2raeuYAnrL29IJRA`

Active environment:

- `default`
- output file: `.env`

## What we did

1. Installed the Stripe Projects plugin into the Stripe CLI.
2. Switched from the non-eligible Stripe account to the eligible account `Spartacus`.
3. Ran `stripe projects init --yes` in the repo root.
4. Confirmed the live catalog before provisioning services.
5. Provisioned Auth0:
   - Added `auth0/free` first because the current catalog requires a plan resource before `auth0/client`.
   - Used Auth0 provider config with:
     - locality: `us`
     - naming prefix: `built-different-stripe`
   - Added `auth0/client` after the free plan existed.
6. Provisioned Supabase:
   - Added `supabase/free` first because the current catalog requires a plan resource before `supabase/project`.
   - Initial `supabase/project` attempts failed because the Supabase account was at its free-project limit.
   - After freeing capacity in Supabase, `supabase/project` succeeded.
7. Provisioned Vercel:
   - Added `vercel/hobby` first because the current catalog requires a plan resource before `vercel/project`.
   - Added `vercel/project` after the hobby plan existed.
8. Pulled and verified environment variables with Stripe Projects.

## Important behavior we confirmed

- The current Stripe Projects catalog on July 30, 2026 requires plan resources before some project resources:
  - Auth0: `auth0/free` before `auth0/client`
  - Supabase: `supabase/free` before `supabase/project`
  - Vercel: `vercel/hobby` before `vercel/project`

- Auth0 rejected naming prefixes containing `auth0` or `okta`.

- Supabase free-project quota can block provisioning even when the provider is linked correctly.

- `.env` is managed locally by Stripe Projects and must stay out of Git.

- `.projects/state.json` and `.projects/state.local.json` should be kept in the repo.

## Files created or changed during setup

- `.projects/state.json`
- `.projects/state.local.json`
- `.projects/vault/vault.json`
- `.env`
- `.gitignore`
- generated agent helper files from `stripe projects init`
- `supabase-stripe-projects-authorized.png`

## Environment variables now expected

Auth0:

- `AUTH0_CLIENT_ID`
- `AUTH0_CLIENT_SECRET`
- `AUTH0_DOMAIN`

Supabase:

- `SUPABASE_DB_PASS`
- `SUPABASE_DB_URL`
- `SUPABASE_POOLER_URL`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_PROJECT_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Vercel:

- `VERCEL_PLAN`
- `VERCEL_TEAM_ID`
- `VERCEL_TEAM_URL`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_PROJECT_LINK`
- `VERCEL_PROJECT_URL`
- `VERCEL_TOKEN`

## App integration notes

- Use Auth0 as the only authentication system.
- In Supabase tables, store the Auth0 user identifier as:

```sql
auth0_user_id text unique not null
```

- Keep `.env` out of version control.
- Verify `stripe projects status` and `stripe projects env` before adding more providers.

## Useful commands

```bash
stripe projects status
stripe projects env
stripe projects env --pull
stripe projects open auth0
stripe projects open supabase
stripe projects open vercel
```
