"use client";

import { useRef } from "react";
import { site } from "@/content";
import { Arrow, ArrowUpRight, Avail, btn, btnGhost } from "@/components/ui";

const links = [
  ["#work", "Work"],
  ["#how", "How I work"],
  ["#about", "About"],
  ["#contact", "Contact"],
];

const menuBtn = "min-h-11 pl-4 text-base font-semibold active:scale-[.96]";

// Phone-only menu. A modal <dialog> gives focus trapping, Escape and an inert page for free.
export function Menu() {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = () => {
    dialog.current?.showModal();
    document.documentElement.style.overflow = "hidden";
  };
  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        className={`${menuBtn} col-[8/-1] justify-self-end md:hidden`}
      >
        Menu
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        onClose={() => (document.documentElement.style.overflow = "")}
        className="on-dark fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none flex-col border-0 bg-ink px-4 pt-5 pb-8 text-paper [--focus:var(--color-accent)] open:flex open:animate-sheet-in backdrop:bg-transparent"
      >
        <div className="flex items-center justify-between">
          <span className="py-3 text-base font-semibold">{site.name}</span>
          <button type="button" onClick={close} className={menuBtn}>
            Close
          </button>
        </div>
        <nav aria-label="Sections" className="mt-10 mb-auto flex flex-col">
          {links.map(([href, label]) => (
            <a
              key={href}
              href={href}
              onClick={close}
              className="disp py-0.5 text-[11vw] leading-[1.08] tracking-[-0.02em] no-underline transition-[color,translate] duration-300 ease-soft hover:translate-x-2 hover:text-accent active:translate-x-2 active:text-accent"
            >
              {label}
            </a>
          ))}
        </nav>
        <a className={`${btn} self-start`} href={`mailto:${site.email}?subject=Hello%20Harsh`}>
          Email me
          <Arrow />
        </a>
        <a className={`${btnGhost} mt-2.5 self-start`} href={site.linkedin}>
          LinkedIn
          <ArrowUpRight />
        </a>
        <p className="mt-[18px] text-base text-soft">
          <Avail className="mb-1.5 text-paper" />
          {site.email}
        </p>
      </dialog>
    </>
  );
}
