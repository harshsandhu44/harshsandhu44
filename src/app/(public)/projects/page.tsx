import { PROJECTS } from '@/lib/constants';
import ProjectCard from '../_components/project-card';

const Projects = () => {
  const projects = PROJECTS;

  return (
    <main className="container flex-1 space-y-8">
      <section className="flex items-center justify-between gap-4">
        <h2 className="text-4xl font-bold">Projects</h2>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </section>
    </main>
  );
};

export default Projects;
