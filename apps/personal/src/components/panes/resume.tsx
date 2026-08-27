import { getExperience, getEducation } from "#lib/content";
import { PaneBody, Section, Stack, Dated } from "./primitives";

export async function ResumePane() {
  const [experience, education] = await Promise.all([
    getExperience(),
    getEducation(),
  ]);

  return (
    <PaneBody>
      <Section title="Experience">
        <div className="space-y-8">
          {experience.map((job) => (
            <Dated
              key={job.slug}
              from={job.start}
              to={job.end}
              current={!job.end}
            >
              <div>
                <h3 className="text-silkscreen font-mono text-sm font-medium">
                  {job.role}
                </h3>
                <p className="text-silk-dim font-mono text-xs">
                  {[job.company, job.location, job.mode]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <ul className="prose-body text-silkscreen space-y-2 text-[0.9rem] leading-relaxed">
                {job.bullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span aria-hidden className="text-silk-dim font-mono">
                      ·
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
              <Stack items={job.stack} />
            </Dated>
          ))}
        </div>
      </Section>

      <Section title="Education">
        <div className="space-y-6">
          {education.map((entry) => (
            <Dated key={entry.slug} from={entry.start} to={entry.end}>
              <div>
                <h3 className="text-silkscreen font-mono text-sm font-medium">
                  {entry.degree}, {entry.field}
                </h3>
                <p className="text-silk-dim font-mono text-xs">
                  {entry.institution} · {entry.location}
                </p>
              </div>
            </Dated>
          ))}
        </div>
      </Section>
    </PaneBody>
  );
}
