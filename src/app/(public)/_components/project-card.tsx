'use client';

import { GithubIcon } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Project } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ExternalLinkIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProjectCardProps {
  size?: 'sm' | 'lg';
  project: Project;
}

const ProjectCard = ({ project, size = 'lg' }: ProjectCardProps) => {
  const cardClasses = cn(
    'hover:shadow-lg transition-all duration-300 group relative overflow-hidden',
    size === 'sm' && 'h-64'
  );

  const imageClasses = cn(
    'object-cover group-hover:scale-105 transition-all duration-300',
    size === 'sm' && 'grayscale group-hover:grayscale-0 blur-sm'
  );

  const titleClasses = cn('text-lg font-bold', size === 'sm' && 'text-sm');

  const descriptionClasses = cn(
    'text-sm text-muted-foreground',
    size === 'sm' && 'text-xs'
  );

  const XsCard = () => {
    return (
      <Link href={project.href}>
        <Card className={cardClasses}>
          <Image
            src={project.image}
            alt={project.label}
            fill
            className={imageClasses}
          />
          <CardContent className="space-y-4 z-10">
            <CardTitle className={titleClasses}>{project.label}</CardTitle>
            <p className={descriptionClasses}>{project.description}</p>
          </CardContent>
        </Card>
      </Link>
    );
  };

  const LgCard = () => {
    return (
      <Card className={cardClasses}>
        <CardHeader className="relative space-y-4">
          <Link
            href={project.href}
            className="relative h-48 w-full overflow-hidden rounded-md"
          >
            <Image
              src={project.image}
              alt={project.label}
              fill
              className="object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
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

  return size === 'sm' ? <XsCard /> : <LgCard />;
};

export default ProjectCard;
