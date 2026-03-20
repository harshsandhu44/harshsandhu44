import { DATA } from "@/lib/constants";
import { AboutImage } from "@/components/about/about-image";
import { DividerRule } from "@/components/editorial";

export default function AboutPage() {
  const { bio, interests, stack } = DATA.about;

  return (
    <>
      {/* Bio section — newspaper column layout */}
      <section className="container section-newspaper" id="section-about-hero">
        <div className="border-t-2 border-foreground pt-1 mb-2">
          <span className="col-header-box">About the Author</span>
        </div>
        <DividerRule variant="thick" className="mb-4" />

        <h1 className="font-serif font-bold text-3xl md:text-4xl tracking-tight mb-1">
          {bio.greeting}
        </h1>
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {bio.catchphrase}
        </span>

        <DividerRule className="my-3" />

        {/* Bio columns + image */}
        <div className="grid grid-cols-1 md:newspaper-grid">
          <div className="md:col-span-3 newspaper-col-first">
            <div className="drop-cap">
              {bio.paragraphs?.map((text, i) => (
                <p key={i} className="newspaper-body mb-3">
                  {text}
                </p>
              ))}
            </div>
          </div>
          <div className="newspaper-col-last mt-4 md:mt-0">
            <div className="w-full aspect-[3/4] overflow-hidden">
              <AboutImage mobile={bio.image.mobile} desktop={bio.image.desktop} />
            </div>
          </div>
        </div>
      </section>

      {/* Interests section — newspaper grid */}
      <section className="container section-newspaper" id="section-about-interests">
        <div className="border-t-2 border-foreground pt-1 mb-2">
          <span className="col-header-box">Interests & Pursuits</span>
        </div>
        <DividerRule className="mb-4" />

        <div className="grid grid-cols-1 md:newspaper-grid">
          {interests.map((item, i) => (
            <div
              key={item.id}
              className={
                i === 0
                  ? "newspaper-col-first"
                  : i === interests.length - 1
                  ? "newspaper-col-last"
                  : "newspaper-col"
              }
            >
              <article className="py-3">
                <span className="col-header-box mb-2 block w-fit">
                  {(item.tags as string[])[0] ?? item.id}
                </span>
                <h3 className="font-serif font-bold text-lg leading-tight mt-2">
                  {item.title as string}
                </h3>
                <p className="newspaper-body mt-1 text-muted-foreground">
                  {item.description as string}
                </p>
              </article>
            </div>
          ))}
        </div>
      </section>

      {/* Stack section */}
      <section className="container py-8" id="section-about-stack">
        <div className="border-t-2 border-foreground pt-1 mb-2">
          <span className="col-header-box">Stack I Actually Reach For</span>
        </div>
        <DividerRule className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {stack.categories.map((category, i) => (
            <div
              key={category.name}
              className={
                i === 0
                  ? "newspaper-col-first"
                  : i === stack.categories.length - 1
                  ? "newspaper-col-last"
                  : "newspaper-col"
              }
            >
              <div className="py-4">
                <span className="col-header-box mb-2 block w-fit">{category.name}</span>
                <p className="font-mono text-xs text-muted-foreground/70 italic mt-2 mb-3">
                  {category.desc}
                </p>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <span key={item} className="block font-mono text-xs uppercase tracking-[0.08em]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

AboutPage.displayName = "AboutPage";
