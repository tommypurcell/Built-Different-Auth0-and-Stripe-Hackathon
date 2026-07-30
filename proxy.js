import { auth0 } from "./lib/auth0";

// Next.js 16 proxy convention (replaces middleware.js). Mounts the SDK's
// /auth/login, /auth/logout, and /auth/callback routes and keeps sessions fresh.
export async function proxy(request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
