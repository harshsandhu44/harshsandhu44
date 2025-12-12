import Image from "next/image";
import { DATA } from "@/lib/constants";
import BentoGrid from "@/components/ui/bento-grid";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  const { bio, interests, stack } = DATA.about;

  return (
    <div className="mx-auto px-4 max-w-7xl">
      <section className="relative py-24 min-h-dvh flex flex-col-reverse lg:grid grid-cols-2 place-content-center gap-x-4 gap-y-12">
        <div className="flex flex-col justify-center gap-4">
          <h1 className="text-5xl md:text-7xl font-black max-w-prose">
            {bio.greeting}
          </h1>
          <p className="text-xl font-medium">{bio.catchphrase}</p>
          <div className="space-y-4">
            {bio.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="text-xl font-medium">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="relative min-h-[25vh] w-full md:min-h-[50vh] lg:aspect-square place-self-center-safe">
          <Image
            src={bio.image}
            alt="Harsh Sandhu"
            fill
            className="object-cover"
          />
        </div>
      </section>

      <section className="py-24 min-h-[50vh] flex items-center justify-center gap-4">
        <BentoGrid items={interests} />
      </section>

      <section className="py-24 min-h-[50vh] flex flex-col items-center justify-center gap-8">
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
