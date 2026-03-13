import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import featuredImg from "@/assets/featured-offer.jpg";

export default function FeaturedOffer() {
  return (
    <section className="py-10">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="relative rounded-2xl overflow-hidden">
          <img src={featuredImg} alt="عرض الموسم" className="w-full h-64 md:h-72 object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-l from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-end p-8 lg:p-12">
            <div className="text-right max-w-md">
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/20 backdrop-blur text-white px-3 py-1 rounded-full mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                العرض المميز
              </span>
              <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">عرض الموسم المميز</h2>
              <p className="text-white/80 text-sm mb-5">
                اختر باقتك المفضلة واستمتع بتجربة سفر متكاملة بأسعار شفافة.
              </p>
              <Link to="/offers">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 rounded-xl font-bold">
                  استكشف العرض
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
