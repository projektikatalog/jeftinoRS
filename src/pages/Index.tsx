 import { Header } from "@/components/catalog/Header";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CartDrawer } from "@/components/catalog/CartDrawer";
import { Footer } from "@/components/catalog/Footer";
import { PromoCards } from "@/components/catalog/PromoCards";
import { PromoSelectionPanel } from "@/components/catalog/PromoSelectionPanel";
import { useAdmin } from "@/context/AdminContext";
import { motion } from "framer-motion";
import { SEO } from "@/components/SEO";

const Index = () => {
  const { products } = useAdmin();
  
  // Filter only available products
  const availableProducts = products.filter(p => p.dostupno);

  // Schema.org JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": availableProducts.map((product, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": product.naziv,
        "description": product.opis,
        "image": product.slike[0],
        "offers": {
          "@type": "Offer",
          "price": product.cena,
          "priceCurrency": "RSD",
          "availability": "https://schema.org/InStock"
        }
      }
    }))
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="JEFTINO.RS | SHOP"
        description="Otkrij najnovije modne trendove na JEFTINO.RS. Naš katalog donosi pažljivo birane premium artikle i streetwear komade koji definišu tvoj stil bez visokih troškova."
        keywords="povoljna odeća, online katalog Srbija, streetwear dropovi, premium stil, JEFTINO.RS"
      />
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
      <Header />
      <CartDrawer />
      <PromoSelectionPanel />

      <main className="pt-20 md:pt-24">
        <section className="container mx-auto px-4 py-8 md:py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2.5rem] p-8 md:p-16 mb-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 bg-gradient-to-r from-[#FACC15] via-[#FB923C] to-[#EF4444]"
          >
            <div className="relative z-10 text-center md:text-left flex-1 space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                  IZGLEDAJ SKUPO. PLATI JEFTINO.
                </h1>
                <p className="text-white text-lg md:text-xl max-w-2xl opacity-90 font-medium leading-relaxed">
                  Najtraženiji komadi sezone su na jedan klik od tebe. Bez kompromisa, bez suvišnih troškova. Samo čist stil.
                </p>
              </div>

              <div className="flex flex-col items-center md:items-start gap-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
                  className="bg-black text-white px-10 py-4 rounded-full font-black text-lg shadow-xl hover:bg-black/90 transition-all uppercase tracking-wider"
                >
                  ISTRAŽI PONUDU
                </motion.button>
              </div>
            </div>

            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                y: [0, -20, 0] 
              }}
              transition={{ 
                scale: { duration: 0.5 },
                opacity: { duration: 0.5 },
                y: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }
              }}
              className="relative z-10 w-56 h-56 md:w-80 md:h-80 flex-shrink-0"
            >
              <img 
                 src="/hero-logo.png" 
                 alt="Jeftino.rs Logo" 
                 className="w-full h-full object-contain mix-blend-multiply contrast-[1.1] brightness-[1.05]"
                 style={{ 
                   filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.2))"
                 }}
               />
            </motion.div>

            {/* Decorative elements */}
            <div aria-hidden="true" className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div aria-hidden="true" className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl" />
          </motion.div>

          {/* Promo Cards below Hero */}
          <div className="mb-12">
            <PromoCards />
          </div>

          <div id="products">
            <ProductGrid products={availableProducts} />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
 };
 
 export default Index;
