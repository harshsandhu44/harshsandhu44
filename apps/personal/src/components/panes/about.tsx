import { getProfile, getSkills } from "#lib/content";
import { PaneBody, Section, Stack } from "./primitives";

export async function AboutPane() {
  const [profile, skills] = await Promise.all([getProfile(), getSkills()]);

  return (
    <PaneBody>
      <header className="space-y-3">
        <h1 className="text-silkscreen font-mono text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
          {profile.name}
        </h1>
        <p className="text-silk-dim font-mono text-sm">
          {profile.role} · {profile.location}
        </p>
        <p className="text-gold font-mono text-sm">{profile.tagline}</p>
      </header>

      <p className="prose-body text-silkscreen text-[0.95rem] leading-relaxed">
        {profile.summary}
      </p>

      <Section title="Skills">
        <dl className="space-y-4">
          {skills.groups.map((group) => (
            <div key={group.name} className="space-y-1.5">
              <dt className="label text-silk-dim">{group.name}</dt>
              <dd>
                <Stack items={group.items} />
              </dd>
            </div>
          ))}
        </dl>
      </Section>
    </PaneBody>
  );
}
