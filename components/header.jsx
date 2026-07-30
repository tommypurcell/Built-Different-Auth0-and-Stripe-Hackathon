import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header({ user = null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-content items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="relative flex size-12 items-center justify-center overflow-hidden rounded-2xl border border-border-subtle bg-surface-card shadow-[0_14px_30px_-18px_rgba(0,0,0,0.45)]">
            <Image
              src="/spartacus-logo.png"
              alt="Spartacus logo"
              fill
              sizes="48px"
              className="object-cover"
            />
          </span>
          <span className="flex flex-col">
            <span className="text-[0.72rem] font-medium uppercase tracking-[0.24em] text-neutral-600">
              Built Different
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Hackathon Judge
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-neutral-700">
          <ThemeToggle />
          <Link
            href="/"
            className="rounded-full px-4 py-2 transition-colors hover:bg-surface-elevated hover:text-text-bright dark:hover:bg-surface-hover"
          >
            Discover
          </Link>
          <Link
            href="/submissions"
            className="rounded-full px-4 py-2 transition-colors hover:bg-surface-elevated hover:text-text-bright dark:hover:bg-surface-hover"
          >
            My Submissions
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden max-w-[12rem] truncate text-neutral-700 sm:block">
                {user.name ?? user.email}
              </span>
              <a
                href="/auth/logout"
                className="rounded-full px-4 py-2 transition-colors hover:bg-surface-elevated hover:text-text-bright dark:hover:bg-surface-hover"
              >
                Logout
              </a>
            </div>
          ) : (
            <a
              href="/auth/login"
              className="rounded-full bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
            >
              Sign In
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
