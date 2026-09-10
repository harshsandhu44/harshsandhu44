// The portfolio content as real, crawlable, screen-reader-navigable DOM. Always
// present on the page; the farm game (farm-portfolio.tsx) is the visual layer
// on top. Visually hidden (clipped, not display:none) so it stays in the
// accessibility tree and the HTML source — search engines and assistive tech
// use it, since the game itself isn't operable without a mouse/keyboard.
//
// Links carry tabIndex={-1}: a screen reader still reaches them via heading /
// link-list navigation, but a sighted keyboard user doesn't Tab into a dozen
// invisible links (the body is overflow:hidden, so they can't be scrolled into
// view either).

import { projects, socials, lines, items, interests, artCredit } from "./data";
import { farmClock } from "@/lib/farm-clock";

const srOnly: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
  border: 0,
};

export function PortfolioFallback() {
  const clock = farmClock();
  return (
    <main style={srOnly}>
      <h1>Harsh Sandhu — Product Engineer</h1>
      <p>{lines[1]}</p>
      <p>{lines[2]}</p>
      <p>{lines[3]}</p>

      <h2>Projects</h2>
      <ul>
        {projects.map((p) => (
          <li key={p.name}>
            <a href={p.url} tabIndex={-1}>
              {p.name}
            </a>{" "}
            — {p.kind}. {p.desc} Built with {p.stack}.
            {p.name === "tinkersim"
              ? ` Current focus (${clock.seasonLabel} ${clock.year}).`
              : ` (${p.status}.)`}
          </li>
        ))}
      </ul>

      <h2>Stack</h2>
      <p>
        {items
          .filter((i) => i.name !== "empty")
          .map((i) => i.name)
          .join(", ")}
        .
      </p>

      <h2>Contact</h2>
      <ul>
        {socials.map((s) => (
          <li key={s.name}>
            <a href={s.url} tabIndex={-1}>
              {s.name}: {s.handle}
            </a>
          </li>
        ))}
      </ul>

      <h2>Interests</h2>
      <p>{interests}.</p>

      <p>
        <a href={artCredit.url} tabIndex={-1}>
          {artCredit.text} (emanuelledev.itch.io)
        </a>
      </p>
    </main>
  );
}

export default PortfolioFallback;
