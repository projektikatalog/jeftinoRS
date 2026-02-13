import { Instagram, MessageCircle, Phone, Truck, Banknote, RotateCcw } from "lucide-react";
import { useState } from "react";
import { TermsOfServiceModal, PrivacyPolicyModal } from "./LegalModals";

export function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const whatsappLink = "https://wa.me/381611234567"; // Placeholder
  const instagramLink = "https://instagram.com"; // Placeholder

  return (
    <footer className="bg-card border-t border-border mt-12">
      {/* Trust Badges Section */}
      <section className="bg-gradient-to-r from-[#FACC15] via-[#FB923C] to-[#EF4444] py-8 overflow-hidden relative">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 lg:gap-24">
            <div className="flex items-center gap-4 text-white group">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 transition-transform group-hover:scale-110">
                <Banknote size={24} strokeWidth={2.5} />
              </div>
              <span className="font-black uppercase tracking-tighter text-sm md:text-base lg:text-lg">Plaćanje pouzećem</span>
            </div>
            <div className="flex items-center gap-4 text-white group">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 transition-transform group-hover:scale-110">
                <Truck size={24} strokeWidth={2.5} />
              </div>
              <span className="font-black uppercase tracking-tighter text-sm md:text-base lg:text-lg">Brza dostava</span>
            </div>
            <div className="flex items-center gap-4 text-white group">
              <div className="p-2 rounded-xl bg-white/10 border border-white/20 transition-transform group-hover:scale-110">
                <RotateCcw size={24} strokeWidth={2.5} />
              </div>
              <span className="font-black uppercase tracking-tighter text-sm md:text-base lg:text-lg">Laka zamena</span>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Section */}
      <section className="border-b border-border/50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">Misija JEFTINO.RS</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Naša misija je da ti omogućimo <span className="text-foreground font-semibold">premium stil</span> bez nepotrebnih troškova.{" "}
              Kao vodeći <span className="text-foreground font-semibold">online katalog u Srbiji</span>, fokusirani smo na najnovije{" "}
              <span className="text-foreground font-semibold">streetwear dropove</span> i pažljivo biranu selekciju koja definiše trendove.{" "}
              Verujemo da <span className="text-foreground font-semibold">povoljna odeća</span> ne treba da znači kompromis sa kvalitetom,{" "}
              već pametan izbor za tvoj autentičan izgled.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand & Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-md overflow-hidden">
                <img 
                  src="/hero-logo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain mix-blend-multiply brightness-110 contrast-110 scale-125"
                />
              </div>
              <span className="text-xl font-black tracking-tighter flex items-center">
                <span className="text-[#E60000] uppercase">JEFTINO</span>
                <span className="text-black ml-0.5">.RS</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              Sigurna kupovina i zagarantovan kvalitet.
            </p>
          </div>

          {/* Quick Info Section */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Informacije</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button 
                  onClick={() => setIsTermsOpen(true)}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Uslovi korišćenja
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setIsPrivacyOpen(true)}
                  className="hover:text-foreground transition-colors text-left"
                >
                  Politika privatnosti
                </button>
              </li>
            </ul>
            <p className="text-sm text-muted-foreground pt-2 border-t border-border mt-2">
              Zamena veličine je moguća u roku od 48h od prijema paketa.
            </p>
          </div>

          {/* Support & Socials Section */}
          <div className="space-y-6">
            <h4 className="font-bold text-foreground uppercase tracking-wider text-sm">Korisnička Podrška</h4>
            <div className="flex flex-col gap-3">
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-3 bg-secondary/50 hover:bg-[#25D366] rounded-2xl transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MessageCircle size={20} className="text-[#25D366]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground font-bold uppercase tracking-tight group-hover:text-white/80">Pišite nam na</span>
                  <span className="text-sm font-black group-hover:text-white">WhatsApp</span>
                </div>
              </a>
              
              <div className="pt-2 flex items-center gap-3">
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary/50 hover:bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:text-white rounded-2xl transition-all duration-300 font-bold text-sm"
                >
                  <Instagram size={18} />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground font-medium">
          <p>© {new Date().getFullYear()} JEFTINO.RS. Sva prava zadržana.</p>
        </div>
      </div>

      <TermsOfServiceModal 
        isOpen={isTermsOpen} 
        onClose={() => setIsTermsOpen(false)} 
      />
      <PrivacyPolicyModal 
        isOpen={isPrivacyOpen} 
        onClose={() => setIsPrivacyOpen(false)} 
      />
    </footer>
  );
}
