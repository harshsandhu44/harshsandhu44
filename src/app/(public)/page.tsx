import { Button, buttonVariants } from '@/components/ui/button';
import { PROJECTS, SOCIAL_LINKS } from '@/lib/constants';
import Link from 'next/link';
import ProjectCard from './_components/project-card';

const Home = () => {
  return (
    <main className="py-12 container space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">Harsh Sandhu</h1>
        <p>
          An Indie Developer from India. Working on building a legacy and make
          an impact on humanity.
          <br />I am a full stack developer and a designer with 5 years of
          professional experience in web development. Currently, I am working as
          a Software Engineer at{' '}
          <span className="underline underline-offset-8">MagicEdtech</span>.
        </p>

        <div className="space-y-2">
          <h2 className="text-lg font-bold">Connect with me</h2>
          <div className="flex gap-4 items-center">
            {SOCIAL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                target="_blank"
                className={buttonVariants({ variant: 'outline', size: 'icon' })}
              >
                <link.icon />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PROJECTS.slice(0, 2).map((project) => (
            <ProjectCard key={project.label} project={project} />
          ))}
        </div>
        {PROJECTS.length > 2 && (
          <div className="flex justify-center">
            <Button variant="outline" asChild>
              <Link href="/projects">View All Projects</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
};

export default Home;
