import { DATA } from "@/lib/constants";
import BentoGrid from "@/components/ui/bento-grid";
import { AboutImage } from "@/components/about/about-image";
import { SectionLabel, DividerRule } from "@/components/editorial";

export default function AboutPage() {
  const { bio, interests, stack } = DATA.about;

  return (
    <>
      <section
        className="relative h-screen w-full overflow-hidden"
        id="section-about-hero"
      >
        <div className="absolute inset-0 z-0">
          <AboutImage mobile={bio.image.mobile} desktop={bio.image.desktop} />
          <div className="absolute inset-0 bg-background/80 dark:bg-background/90" />
          <div className="absolute inset-0 bg-linear-to-b from-0% from-background via-10% via-transparent to-100% to-background" />
        </div>

        <div className="container relative z-10 flex h-full flex-col justify-center md:px-12">
          <div className="max-w-2xl space-y-8">
            <h1 className="font-serif font-bold text-5xl tracking-tight sm:text-7xl xl:text-8xl">
              {bio.greeting}
            </h1>

            <span className="font-mono text-sm uppercase tracking-widest text-muted-foreground">
              {bio.catchphrase}
            </span>

            <div className="space-y-6 text-lg sm:text-xl leading-relaxed">
              {bio.paragraphs?.map((text, i) => (
                <p key={i} className="max-w-prose font-sans">{text}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section
        className="px-4 max-w-7xl mx-auto py-24 min-h-[50vh] flex items-center justify-center gap-4"
        id="section-about-interests"
      >
        <BentoGrid items={interests} />
      </section>

      <section
        className="px-4 max-w-7xl mx-auto py-24 min-h-[50vh] flex flex-col items-center justify-center gap-8"
        id="section-about-stack"
      >
        <div className="w-full space-y-2">
          <div className="flex items-center gap-4 mb-8">
            <SectionLabel ruled>STACK I ACTUALLY REACH FOR</SectionLabel>
            <DividerRule className="flex-1" />
          </div>
        </div>

        <div className="w-full grid gap-0 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-border border-t border-border">
          {stack.categories.map((category) => (
            <div key={category.name} className="p-6 space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>{category.name}</SectionLabel>
                <category.icon className="size-4 text-primary" />
              </div>
              <p className="font-mono text-xs text-muted-foreground/70 italic">
                {category.desc}
              </p>
              <div className="flex flex-wrap gap-x-2 gap-y-1">
                {category.items.map((item, i) => (
                  <span key={item} className="font-mono text-xs uppercase tracking-[0.08em]">
                    {item}{i < category.items.length - 1 ? " ·" : ""}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

AboutPage.displayName = "AboutPage";
