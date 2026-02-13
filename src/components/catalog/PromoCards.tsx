import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Truck } from "lucide-react";
import { Promotion } from "@/types";

export function PromoCards() {
  const { setActivePromotion, setIsPromoPanelOpen, clearPromoItems } = useCart();
  const { promotions } = useAdmin();

  const activePromos = promotions.filter((p) => p.aktivna);

  if (activePromos.length === 0) return null;

  const handleStartPromo = (promo: Promotion) => {
    clearPromoItems(); // Samo očisti prethodnu akciju, ne i celu korpu
    setActivePromotion(promo);
    setIsPromoPanelOpen(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price);
  };

  return (
    <section className="w-full mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-6"
      >
        <div aria-hidden="true" className="h-px flex-1 bg-black/10" />
        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
          <Sparkles aria-hidden="true" className="text-yellow-500 fill-yellow-500" size={24} />
          NAŠE AKTIVNE AKCIJE
        </h2>
        <div aria-hidden="true" className="h-px flex-1 bg-black/10" />
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto px-4">
        {activePromos.map((promo, index) => (
          <motion.div
            key={promo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleStartPromo(promo)}
            className="relative h-[320px] md:h-[400px] overflow-hidden rounded-[2rem] md:rounded-[2.5rem] cursor-pointer group bg-gradient-to-br from-[#FACC15] via-[#FB923C] to-[#EF4444] shadow-2xl transition-all duration-300 hover:-translate-y-2"
          >
            {/* Image Area */}
            <div className="absolute inset-0 z-10">
              {promo.promo_image_url && (
                <div className="w-full h-full relative">
                  <img 
                    src={promo.promo_image_url} 
                    alt={`${promo.naslov} - JEFTINO.RS Katalog 2026`}
                    className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:saturate-[1.2]"
                  />
                  <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                </div>
              )}
            </div>

            {/* Delivery Badge - Top Right */}
            <div className="absolute top-4 right-4 z-30">
              <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                <Truck size={14} className="text-white" />
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                  Dostava 24/48h
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 md:p-8 space-y-4">
              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                  {promo.naslov}
                </h3>
                
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                  <span className="text-xl md:text-2xl font-black text-white tracking-tighter">
                    {formatPrice(promo.ukupna_cena)} <span className="text-xs">RSD</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 bg-white text-black py-3.5 px-6 rounded-full font-black text-sm md:text-base uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>IZABERI PAKET</span>
                  <ArrowRight size={18} />
                </motion.button>
              </div>

              <div aria-hidden="true" className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-white/20" />
                <span className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">
                  {promo.required_items || promo.potrebna_kolicina} ARTIKLA
                </span>
                <div className="h-px flex-1 bg-white/20" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <div aria-hidden="true" className="mt-12 flex items-center gap-3">
        <div className="h-px flex-1 bg-black/10" />
        <div className="w-2 h-2 rounded-full bg-black/10" />
        <div className="h-px flex-1 bg-black/10" />
      </div>
    </section>
  );
}
