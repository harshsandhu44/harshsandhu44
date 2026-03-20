import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { DATA } from "@/lib/constants";
import { buttonVariants } from "@/components/ui/button";
import { ArrowLeftIcon, ExternalLinkIcon } from "lucide-react";
import { siteConfig } from "@/config/site";
import { SectionLabel, DividerRule } from "@/components/editorial";

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
        className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-2"
      >
        <ArrowLeftIcon className="size-3" /> All Projects
      </Link>

      <div className="space-y-6">
        <div className="space-y-3">
          {project.featured && (
            <SectionLabel>{project.category ?? "FEATURED"}</SectionLabel>
          )}
          <h1 className="font-serif font-bold text-5xl md:text-6xl leading-tight tracking-tight">
            {project.title}
          </h1>
          <p className="font-sans text-xl text-muted-foreground leading-relaxed">
            {project.subtext}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {project.tags.map((tag, i) => (
            <span key={tag} className="font-mono text-xs uppercase tracking-[0.1em] text-muted-foreground">
              {tag}{i < project.tags.length - 1 ? " ·" : ""}
            </span>
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

      <DividerRule />

      <p className="font-sans text-lg leading-relaxed text-muted-foreground">
        {project.longDescription}
      </p>
    </div>
  );
}
