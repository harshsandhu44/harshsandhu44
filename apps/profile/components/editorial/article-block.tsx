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
  className?: string;
}

export function ArticleBlock({
  sectionLabel,
  title,
  deck,
  tags,
  href,
  featured,
  className,
}: ArticleBlockProps) {
  return (
    <article
      className={cn(
        "py-6 group",
        featured ? "border-t-2 border-foreground" : "border-t border-border",
        className,
      )}
    >
      <SectionLabel className="mb-3 block">{sectionLabel}</SectionLabel>

      {featured ? (
        <h2 className="font-serif font-bold text-4xl md:text-5xl leading-tight tracking-tight mb-3">
          {title}
        </h2>
      ) : (
        <h3 className="font-serif font-bold text-2xl md:text-3xl leading-tight tracking-tight mb-3">
          {title}
        </h3>
      )}

      <p className="font-sans text-base text-muted-foreground leading-relaxed mb-4 max-w-prose">
        {deck}
      </p>

      <footer className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
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
