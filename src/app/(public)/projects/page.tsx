'use client';

import { Input } from '@/components/ui/input';
import { PROJECTS } from '@/lib/constants';
import { useState } from 'react';
import ProjectCard from '../_components/project-card';
import { Button } from '@/components/ui/button';
import { SearchIcon } from 'lucide-react';

const Projects = () => {
  const [search, setSearch] = useState('');
  const projects = PROJECTS;

  const filteredProjects = projects.filter(
    (project) =>
      project.label.toLowerCase().includes(search.toLowerCase()) ||
      project.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="container flex-1 space-y-8">
      <section className="flex items-center justify-between gap-4">
        <h2 className="text-4xl font-bold">Projects</h2>
      </section>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
        <Button variant="outline" size="icon">
          <SearchIcon className="size-4" />
        </Button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredProjects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </section>
    </main>
  );
};

export default Projects;
