import { cn } from "@/lib/utils";

interface DividerRuleProps {
  variant?: "thin" | "thick" | "double";
  label?: string;
  className?: string;
}

export function DividerRule({ variant = "thin", label, className }: DividerRuleProps) {
  const borderClass =
    variant === "thick"
      ? "border-t-2 border-foreground"
      : variant === "double"
        ? "border-t-[3px] border-double border-foreground"
        : "border-t border-border";

  if (label) {
    return (
      <div className={cn("flex items-center gap-4", className)}>
        <hr className={cn("flex-1 border-0", borderClass.replace("border-t", "border-b"))} />
        <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
          {label}
        </span>
        <hr className={cn("flex-1 border-0", borderClass.replace("border-t", "border-b"))} />
      </div>
    );
  }

  return <div className={cn(borderClass, className)} />;
}

DividerRule.displayName = "DividerRule";
