import { getProfile } from "#lib/content";
import { PaneBody, Section } from "./primitives";

export async function ContactPane() {
  const profile = await getProfile();

  return (
    <PaneBody>
      <header className="space-y-3">
        <h1 className="text-silkscreen font-mono text-xl font-medium leading-tight tracking-tight">
          Let&rsquo;s build something useful.
        </h1>
        <p className="prose-body text-silk-dim text-[0.95rem] leading-relaxed">
          Open to product, frontend, and developer-tooling conversations.
        </p>
      </header>

      <Section title="Direct">
        <dl className="space-y-3 font-mono text-sm">
          <Row label="Email">
            <Wire href={`mailto:${profile.email}`}>{profile.email}</Wire>
          </Row>
          <Row label="Phone">
            <Wire href={`tel:${profile.phone.replace(/\s/g, "")}`}>
              {profile.phone}
            </Wire>
          </Row>
          <Row label="Based">
            <span className="text-silkscreen">{profile.location}</span>
          </Row>
        </dl>
      </Section>

      <Section title="Elsewhere">
        <ul className="space-y-3 font-mono text-sm">
          {profile.links.map((link) => (
            <li key={link.href}>
              <Wire href={link.href!}>{link.label}</Wire>
            </li>
          ))}
        </ul>
      </Section>
    </PaneBody>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-x-4 sm:grid-cols-[5rem_1fr]">
      <dt className="label text-silk-dim pt-0.5">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/* Links are the one thing on the board that carries current, so they are the
 * one thing that gets gold. */
function Wire({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "me noreferrer" } : {})}
      className="text-gold decoration-gold/40 underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}
