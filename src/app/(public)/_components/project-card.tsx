"use client";

import { GithubIcon } from "@/components";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { Project } from "@/lib/types";
import { ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard = ({ project }: ProjectCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardHeader className="relative space-y-4">
        <Link
          href={project.href}
          className="relative h-48 w-full overflow-hidden rounded-md"
        >
          <Image
            src={project.image}
            alt={project.label}
            fill
            className="object-cover group-hover:scale-105 transition-all duration-300"
          />
        </Link>
        <CardTitle>{project.label}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{project.description}</p>
        <div className="flex gap-x-2 gap-y-1 flex-wrap">
          {project.technologies.map((technology) => (
            <Badge key={technology} variant="outline">
              {technology}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-between w-full gap-x-2">
          <Button variant="outline" asChild>
            <Link href={project.github} target="_blank">
              <GithubIcon />
              GitHub
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={project.live} target="_blank">
              <ExternalLinkIcon className="w-4 h-4" />
              Live
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProjectCard;
