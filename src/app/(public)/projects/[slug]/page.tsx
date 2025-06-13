import { PROJECTS } from '@/lib/constants';

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const { default: Project } = await import(`@/markdown/${slug}.mdx`);

  return <Project />;
};

export function generateStaticParams() {
  return PROJECTS.map((project) => ({ slug: project.slug }));
}

export const dynamicParams = false;
export default Page;
