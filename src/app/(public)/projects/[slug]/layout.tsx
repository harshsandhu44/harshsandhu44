const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="mx-auto prose dark:prose-invert prose-zinc">{children}</div>
  );
};

export default Layout;
