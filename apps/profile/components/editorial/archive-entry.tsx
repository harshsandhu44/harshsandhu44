import { cn } from "@/lib/utils";

interface ArchiveEntryProps {
  period: string;
  company: string;
  role: string;
  description: string;
  suppressInternalBorder?: boolean;
  className?: string;
}

export function ArchiveEntry({
  period,
  company,
  role,
  description,
  suppressInternalBorder = false,
  className,
}: ArchiveEntryProps) {
  return (
    <article
      className={cn(
        "grid grid-cols-[5rem_1fr] md:grid-cols-[6rem_1fr] gap-4 py-4",
        className,
      )}
    >
      <div className={cn("pr-3", !suppressInternalBorder && "border-r border-border")}>
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground leading-relaxed">
          {period}
        </span>
      </div>
      <div className="space-y-1">
        <p className="font-serif font-bold text-lg leading-tight">{company}</p>
        <p className="font-sans text-xs text-muted-foreground uppercase tracking-[0.08em]">{role}</p>
        <p className="newspaper-body text-foreground/80 pt-1">
          {description}
        </p>
      </div>
    </article>
  );
}

ArchiveEntry.displayName = "ArchiveEntry";
