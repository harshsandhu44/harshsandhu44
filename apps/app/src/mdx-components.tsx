import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => <h2 className="mt-14 mb-4 text-3xl font-semibold tracking-tight first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-8 mb-2 text-xl font-semibold" {...props} />,
  p: (props) => <p className="my-4 text-lg leading-[1.7]" {...props} />,
  ul: (props) => <ul className="my-4 list-disc space-y-2 pl-5 text-lg leading-[1.7] marker:text-natural" {...props} />,
  a: (props) => <a className="link" {...props} />,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
