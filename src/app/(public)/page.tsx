import { GithubIcon, InstagramIcon } from "@/components/icons";
import { buttonVariants } from "@/components/ui";
import Link from "next/link";

const Home = () => {
  return (
    <main className="py-12 container space-y-12">
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">Harsh Sandhu</h1>
        <p>
          An Indie Developer from India. Working on building a legacy and make
          an impact on humanity.
          <br />I am a full stack developer and a designer with 5 years of
          professional experience in web development. Currently, I am working as
          a Software Engineer at{" "}
          <span className="underline underline-offset-8">MagicEdtech</span>.
        </p>

        <div className="space-y-2">
          <h2 className="text-lg font-bold">Connect with me</h2>
          <div className="flex gap-4 items-center">
            <Link
              href="https://github.com/harshsandhu44"
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <GithubIcon />
            </Link>
            <Link
              href="https://www.instagram.com/95_harshsandhu/"
              target="_blank"
              className={buttonVariants({ variant: "outline", size: "icon" })}
            >
              <InstagramIcon />
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-bold">Projects</h2>
      </section>
    </main>
  );
};

export default Home;
