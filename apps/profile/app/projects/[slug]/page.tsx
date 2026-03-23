import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DATA } from "@/lib/constants";
import { Badge, buttonVariants } from "@harshsandhu44/ui";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { siteConfig } from "@/config/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return DATA.selectedWorks.projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = DATA.selectedWorks.projects.find((p) => p.slug === slug);

  if (!project) return {};

  return {
    title: project.title,
    description: project.subtext,
    openGraph: {
      title: `${project.title} | ${siteConfig.name}`,
      description: project.subtext,
      url: `${siteConfig.url}/projects/${slug}`,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = DATA.selectedWorks.projects.find((p) => p.slug === slug);

  if (!project) notFound();

  return (
    <div className="max-w-3xl container py-24 space-y-12">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeftIcon className="size-4" /> All Projects
      </Link>

      <div className="space-y-6">
        <div className="space-y-3">
          {project.featured && (
            <span className="text-xs font-medium text-primary uppercase tracking-wide">
              Featured
            </span>
          )}
          <h1 className="text-4xl md:text-6xl font-black">{project.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {project.subtext}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>

        {project.link && (
          <a
            href={project.link}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            View Project <ExternalLinkIcon className="size-4" />
          </a>
        )}
      </div>

      <div className="prose prose-invert max-w-none">
        <p className="text-lg leading-relaxed text-muted-foreground">
          {project.longDescription}
        </p>
      </div>
    </div>
  );
}
