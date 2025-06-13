const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  const { default: Project } = await import(`@/markdown/${slug}.mdx`);

  return <Project />;
};

export function generateStaticParams() {
  return [{ slug: 'moodsync-app' }];
}

export const dynamicParams = false;
export default Page;
