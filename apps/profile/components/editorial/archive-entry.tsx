import { cn } from "@/lib/utils";

interface ArchiveEntryProps {
  period: string;
  company: string;
  role: string;
  description: string;
  className?: string;
}

export function ArchiveEntry({
  period,
  company,
  role,
  description,
  className,
}: ArchiveEntryProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[5rem_1fr] md:grid-cols-[8rem_1fr] gap-6 py-6",
        className,
      )}
    >
      <div className="border-r border-border pr-4">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground leading-relaxed">
          {period}
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-serif font-bold text-xl leading-tight">{company}</p>
        <p className="font-sans text-sm text-muted-foreground">{role}</p>
        <p className="font-sans text-sm leading-relaxed text-foreground/80 pt-1">
          {description}
        </p>
      </div>
    </article>
  );
}

ArchiveEntry.displayName = "ArchiveEntry";
