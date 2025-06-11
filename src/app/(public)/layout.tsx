import { Footer, Header } from "@/components";

const PublicLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
};

export default PublicLayout;
