const Footer = () => {
  return (
    <footer className="py-4">
      <div className="container">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Harsh Sandhu. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
