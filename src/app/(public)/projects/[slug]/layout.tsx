const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="container prose dark:prose-invert prose-zinc">
      {children}
    </div>
  );
};

export default Layout;
