import { cn } from "@/lib/utils";

interface SectionLabelProps {
  children: React.ReactNode;
  ruled?: boolean;
  className?: string;
}

export function SectionLabel({ children, ruled, className }: SectionLabelProps) {
  return (
    <span
      className={cn(
        "font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground",
        ruled && "border-t border-border pt-2",
        className,
      )}
    >
      {children}
    </span>
  );
}

SectionLabel.displayName = "SectionLabel";
