import { cn } from "@harshsandhu44/ui/lib/utils";

/** Panes are documents, so they share one measure and one rhythm. */
export function PaneBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-[62ch] space-y-10 p-6 sm:p-8", className)}>
      {children}
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="label text-silk-dim border-rule border-b pb-2">{title}</h2>
      {children}
    </section>
  );
}

/** A stack list. Not chips — chips imply clickable, and these do nothing. */
export function Stack({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-silk-dim font-mono text-xs">{items.join("  ·  ")}</p>
  );
}

/** Dates are the spine of a résumé, so they get their own column and tabular
 * figures — every year lines up vertically down the page. */
export function Dated({
  from,
  to,
  current,
  children,
}: {
  from: string;
  to: string;
  current?: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="grid gap-x-6 gap-y-2 sm:grid-cols-[8.5rem_1fr]">
      <p
        className={cn(
          "whitespace-nowrap font-mono text-xs",
          current ? "text-silkscreen" : "text-silk-dim",
        )}
      >
        {from} <span aria-hidden>—</span> {to || "present"}
      </p>
      <div className="space-y-3">{children}</div>
    </article>
  );
}
