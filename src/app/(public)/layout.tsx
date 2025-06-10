import Header from "@/components/header";

const PublicLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default PublicLayout;
