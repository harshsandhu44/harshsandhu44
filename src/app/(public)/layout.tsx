import Header from "@/components/Header";

const PublicLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default PublicLayout;
