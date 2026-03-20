import { cn } from "@/lib/utils";

interface MetadataRowProps {
  items: Array<{ label?: string; value: string }>;
  className?: string;
}

export function MetadataRow({ items, className }: MetadataRowProps) {
  return (
    <div className={cn("flex items-center gap-0 font-mono text-xs text-muted-foreground", className)}>
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-1 px-3",
            i > 0 && "border-l border-border",
            i === 0 && "pl-0",
          )}
        >
          {item.label && (
            <span className="uppercase tracking-[0.1em] opacity-60">{item.label}:</span>
          )}
          <span className="uppercase tracking-[0.1em]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

MetadataRow.displayName = "MetadataRow";
