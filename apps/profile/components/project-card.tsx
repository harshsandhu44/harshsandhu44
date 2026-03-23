import Link from "next/link";
import { Badge } from "@harshsandhu44/ui";
import { ExternalLinkIcon, ArrowRightIcon } from "lucide-react";

interface ProjectCardProps {
  slug: string;
  title: string;
  subtext: string;
  tags: string[];
  link?: string;
  featured?: boolean;
}

export function ProjectCard({ slug, title, subtext, tags, link, featured }: ProjectCardProps) {
  return (
    <div className="group relative border border-border rounded-xl p-6 flex flex-col gap-4 hover:border-foreground/30 transition-colors bg-card">
      {featured && (
        <span className="absolute top-4 right-4 text-xs font-medium text-primary">
          Featured
        </span>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{subtext}</p>
      </div>
      <div className="flex flex-wrap gap-2 mt-auto">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-xs font-normal">
            {tag}
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-4 pt-2 border-t border-border">
        <Link
          href={`/projects/${slug}`}
          className="flex items-center gap-1 text-sm font-medium hover:text-primary transition-colors"
        >
          Details <ArrowRightIcon className="size-3" />
        </Link>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Visit <ExternalLinkIcon className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}

ProjectCard.displayName = "ProjectCard";
