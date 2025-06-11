import Footer from "@/components/footer";
import Header from "@/components/header";

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
