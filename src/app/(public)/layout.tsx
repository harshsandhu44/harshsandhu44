import Footer from '@/components/footer';
import Header from '@/components/header';

const PublicLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {children}
      <Footer />
    </div>
  );
};

export default PublicLayout;
