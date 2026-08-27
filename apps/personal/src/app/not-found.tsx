import Link from "next/link";
import { SECTIONS } from "../components/wm/views";

/* The shell's own error voice: say what happened, then hand back the paths that
 * do exist. No apology, no dead end. */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="space-y-4 font-mono text-sm">
        <p className="text-flux">cd: no such file or directory</p>
        <p className="text-silk-dim">these exist:</p>
        <ul className="space-y-1">
          {SECTIONS.map((section) => (
            <li key={section.view}>
              <Link
                href={`/${section.view}`}
                className="text-gold decoration-gold/40 underline-offset-4 hover:underline"
              >
                ~/{section.view}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
