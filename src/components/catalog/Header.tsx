 import { ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export function Header() {
  const { totalItems, setIsCartOpen } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex-1 flex justify-center md:justify-start">
             <Link to="/" className="flex items-center gap-3 group">
               <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white flex items-center justify-center shadow-md transition-transform duration-500 group-hover:rotate-[360deg] overflow-hidden">
                 <img 
                   src="/hero-logo.png" 
                   alt="Logo" 
                   className="w-full h-full object-contain mix-blend-multiply brightness-110 contrast-110 scale-125"
                 />
               </div>
               <span className="text-xl md:text-2xl font-black tracking-tighter flex items-center">
                 <span className="text-[#E60000] uppercase">JEFTINO</span>
                 <span className="text-black ml-0.5">.RS</span>
               </span>
             </Link>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:text-[#E60000] transition-colors"
            >
              <ShoppingBag size={24} />
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#E60000] text-white rounded-full flex items-center justify-center text-[10px] font-bold"
                >
                  {totalItems}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  );
}