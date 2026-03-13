import { forwardRef, ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import OfflineBanner from "./OfflineBanner";

interface LayoutProps {
  children: ReactNode;
}

const Layout = forwardRef<HTMLDivElement, LayoutProps>(({ children }, ref) => {
  return (
    <div ref={ref} className="min-h-screen flex flex-col">
      <OfflineBanner />
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
});

Layout.displayName = "Layout";

export default Layout;
