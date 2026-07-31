import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";

export function ProjectRow({ project }) {
  return (
    <Link
      href={`/submissions/${project.id}`}
      className="group flex items-center gap-4 rounded-[28px] border border-white/70 bg-white/88 p-4 shadow-[0_18px_50px_-30px_rgba(38,33,20,0.35)] transition duration-200 hover:-translate-y-0.5 hover:border-accent-300 hover:shadow-[0_28px_70px_-34px_rgba(72,55,214,0.28)]"
    >
      <div
        className="relative size-20 shrink-0 overflow-hidden rounded-[24px]"
        style={{ background: project.coverColor }}
      >
        {project.coverImage ? (
          <img
            src={project.coverImage}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_58%)]" />
        )}
      </div>
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="truncate text-base font-semibold tracking-tight">
          {project.name}
        </div>
        <div className="text-sm text-muted-foreground">
          {project.category}
          {project.tagline ? ` · ${project.tagline}` : ""}
        </div>
        <StatusBadge status={project.status} />
      </div>
      <span className="ml-auto hidden text-sm font-medium text-accent-800 transition-transform duration-200 group-hover:translate-x-1 md:block">
        Open
      </span>
    </Link>
  );
}
