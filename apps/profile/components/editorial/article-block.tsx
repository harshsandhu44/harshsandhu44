import Link from "next/link";
import { cn } from "@/lib/utils";
import { SectionLabel } from "./section-label";

interface ArticleBlockProps {
  sectionLabel: string;
  title: string;
  deck: string;
  tags: string[];
  href?: string;
  featured?: boolean;
  body?: string;
  className?: string;
}

export function ArticleBlock({
  sectionLabel,
  title,
  deck,
  tags,
  href,
  featured,
  body,
  className,
}: ArticleBlockProps) {
  return (
    <article
      className={cn(
        "pt-4 pb-0 group",
        featured ? "border-t-2 border-foreground" : "border-t border-border",
        className,
      )}
    >
      <SectionLabel className="mb-3 block">{sectionLabel}</SectionLabel>

      {featured ? (
        <h2 className="font-serif font-bold text-4xl md:text-5xl leading-tight tracking-tight mb-2">
          {title}
        </h2>
      ) : (
        <h3 className="font-serif font-bold text-xl md:text-2xl leading-tight tracking-tight mb-2">
          {title}
        </h3>
      )}

      <p className="newspaper-body mt-1 mb-3 text-muted-foreground">
        {deck}
      </p>

      {body && (
        <div className="drop-cap mt-2">
          <p className="newspaper-body">{body}</p>
        </div>
      )}

      <footer className="flex items-center justify-between gap-4 mt-3">
        <span className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
          {tags.join(", ")}
        </span>
        {href && (
          <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs uppercase tracking-widest text-foreground hover:text-primary transition-colors shrink-0"
          >
            View →
          </Link>
        )}
      </footer>
    </article>
  );
}

ArticleBlock.displayName = "ArticleBlock";
