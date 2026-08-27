import { getProjects } from "#lib/content";
import { PaneBody, Section, Stack } from "./primitives";

export async function WorkPane() {
  const projects = await getProjects();
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <PaneBody>
      <Section title="Selected">
        <ul className="space-y-7">
          {featured.map((project) => (
            <Entry key={project.slug} project={project} />
          ))}
        </ul>
      </Section>

      {rest.length > 0 && (
        <Section title="Also built">
          <ul className="space-y-7">
            {rest.map((project) => (
              <Entry key={project.slug} project={project} />
            ))}
          </ul>
        </Section>
      )}
    </PaneBody>
  );
}

function Entry({
  project,
}: {
  project: Awaited<ReturnType<typeof getProjects>>[number];
}) {
  return (
    <li className="space-y-2">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-silkscreen font-mono text-sm font-medium">
          {project.name}
        </h3>
        <span className="text-silk-dim shrink-0 font-mono text-xs">
          {project.year}
        </span>
      </div>
      <p className="prose-body text-silkscreen text-[0.9rem] leading-relaxed">
        {project.blurb}
      </p>
      <Stack items={project.stack} />
    </li>
  );
}
