import Footer from "@/components/layout/Footer";
import Navbarre from "@/components/layout/Navbarre";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-[#0F2A43]">
      <Navbarre/>

      <main>{children}</main>

      <Footer/>
    </div>
  );
}