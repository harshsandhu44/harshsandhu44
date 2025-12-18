import Image from "next/image";
import { DATA } from "@/lib/constants";
import BentoGrid from "@/components/ui/bento-grid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlurFade } from "@/components/ui/blur-fade";

export default function AboutPage() {
  const { bio, interests, stack } = DATA.about;

  return (
    <div>
      <section className="dark relative h-screen w-full overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <Image
            src={bio.image}
            alt="Harsh Sandhu"
            fill
            priority
            className="object-cover object-center opacity-90"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-primary/75" />
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10 flex h-full flex-col justify-center md:px-12">
          <div className="max-w-2xl space-y-8">
            <BlurFade delay={0.1} inView>
              <h1 className="text-5xl font-bold tracking-tighter text-primary-foreground sm:text-7xl xl:text-8xl">
                {bio.greeting}
              </h1>
            </BlurFade>

            <BlurFade delay={0.3} inView>
              <span className="text-lg sm:text-xl font-medium text-primary-foreground">
                {bio.catchphrase}
              </span>
            </BlurFade>

            <div className="space-y-6 text-lg sm:text-xl font-medium leading-relaxed text-primary-foreground">
              {bio.paragraphs?.map((text, i) => (
                <BlurFade key={i} delay={0.5 + i * 0.2} inView>
                  <p className="max-w-prose">{text}</p>
                </BlurFade>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 max-w-7xl mx-auto py-24 min-h-[50vh] flex items-center justify-center gap-4">
        <BentoGrid items={interests} />
      </section>

      <section className="px-4 max-w-7xl mx-auto py-24 min-h-[50vh] flex flex-col items-center justify-center gap-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{stack.header}</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stack.categories.map((category) => (
            <Card
              key={category.name}
              className="group hover:border-foreground/20 transition-colors"
            >
              <CardHeader className="space-y-1 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {category.name}
                  </CardTitle>
                  <category.icon className="size-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {category.desc}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {category.items.map((item) => (
                    <Badge
                      key={item}
                      variant="secondary"
                      className="font-normal bg-secondary/50 hover:bg-secondary"
                    >
                      {item}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

AboutPage.displayName = "AboutPage";
