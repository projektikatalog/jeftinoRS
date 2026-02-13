 import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { CartItem, Product, Variant, PromoSettings, Promotion } from "@/types";
import { supabase } from "@/lib/supabase";

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, size: string, quantity?: number, variant?: Variant, bundleId?: string | null) => void;
  removeFromCart: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  clearPromoItems: () => void;
  totalItems: number;
  totalPrice: number;
  shippingCost: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  // Multi-promo system
  activePromotion: Promotion | null;
  setActivePromotion: (promo: Promotion | null) => void;
  promoItems: CartItem[];
  addPromoItem: (product: Product, size: string, quantity?: number, variant?: Variant, stepIndex?: number) => void;
  removePromoItem: (productId: string, size: string, stepIndex?: number) => void;
  removeBundle: (bundleId: string) => void;
  isPromoComplete: boolean;
  promoQuantity: number;
  requiredPromoQuantity: number;
  isPromoPanelOpen: boolean;
  setIsPromoPanelOpen: (open: boolean, step?: number) => void;
  promoPanelStep: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activePromotion, setActivePromotion] = useState<Promotion | null>(null);
  const [isPromoPanelOpen, setIsPromoPanelOpenState] = useState(false);
  const [promoPanelStep, setPromoPanelStep] = useState(0);
  const [promoItems, setPromoItems] = useState<CartItem[]>([]);

  const setIsPromoPanelOpen = (open: boolean, step: number = 0) => {
    setPromoPanelStep(step);
    setIsPromoPanelOpenState(open);
  };

  useEffect(() => {
    try {
      const sItems = localStorage.getItem('cart_items');
      const sPromoItems = localStorage.getItem('cart_promo_items');
      const sActivePromo = localStorage.getItem('cart_active_promotion');
      if (sItems) setItems(JSON.parse(sItems));
      if (sPromoItems) setPromoItems(JSON.parse(sPromoItems));
      if (sActivePromo) setActivePromotion(JSON.parse(sActivePromo));
    } catch (e) { void e; }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('cart_items', JSON.stringify(items));
      localStorage.setItem('cart_promo_items', JSON.stringify(promoItems));
      localStorage.setItem('cart_active_promotion', JSON.stringify(activePromotion));
    } catch (e) { void e; }
  }, [items, promoItems, activePromotion]);

  const addToCart = (product: Product, size: string, quantity: number = 1, variant?: Variant, bundleId: string | null = null) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && item.size === size && (item.variant?.name === variant?.name) && ((item.bundle_id || null) === (bundleId || null))
      );
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        if (variant && !updated[existingIndex].variant) {
            updated[existingIndex].variant = variant;
        }
        return updated;
      }
      
      return [...prev, { product, size, quantity, variant, bundle_id: bundleId, isPromo: !!bundleId }];
    });
  };

  const addPromoItem = (product: Product, size: string, quantity: number = 1, variant?: Variant, stepIndex?: number) => {
    if (!activePromotion) return;
    
    setPromoItems((prev) => {
      // If we have a stepIndex, we are in a slot-based bundle
      if (stepIndex !== undefined) {
        // Remove existing item for this step if it exists
        const filtered = prev.filter(item => item.stepIndex !== stepIndex);
        return [...filtered, { product, size, quantity: 1, variant, bundle_id: activePromotion.id, isPromo: true, stepIndex }];
      }

      const currentQuantity = prev.reduce((sum, item) => sum + item.quantity, 0);
      const requiredQty = activePromotion.required_items || activePromotion.potrebna_kolicina;
      
      // Strict limit: don't add if already full
      if (currentQuantity >= requiredQty) return prev;
      
      const quantityToAdd = Math.min(quantity, requiredQty - currentQuantity);
      
      const existingIndex = prev.findIndex(
        (item) => item.product.id === product.id && 
                  item.size === size && 
                  item.variant?.name === variant?.name &&
                  (item.bundle_id || null) === (activePromotion.id || null)
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantityToAdd;
        return updated;
      }

      return [...prev, { product, size, quantity: quantityToAdd, variant, bundle_id: activePromotion.id, isPromo: true }];
    });
  };

  const removePromoItem = (productId: string, size: string, stepIndex?: number) => {
    setPromoItems((prev) => {
      if (stepIndex !== undefined) {
        return prev.filter(item => item.stepIndex !== stepIndex);
      }

      // Manual find last index for compatibility
      let existingIndex = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].product.id === productId && prev[i].size === size) {
          existingIndex = i;
          break;
        }
      }

      if (existingIndex === -1) return prev;

      const updated = [...prev];
      if (updated[existingIndex].quantity > 1) {
        updated[existingIndex].quantity -= 1;
      } else {
        updated.splice(existingIndex, 1);
      }
      return updated;
    });
  };

  const removeFromCart = (productId: string, size: string) => {
    setItems((prev) =>
      prev.filter(
        (item) => !(item.product.id === productId && item.size === size)
      )
    );
  };

  const updateQuantity = (productId: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId && item.size === size
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPromoItems([]);
  };

  const clearPromoItems = () => {
    setPromoItems([]);
  };

  const removeBundle = (bundleId: string) => {
    setPromoItems((prev) => prev.filter(item => (item.bundle_id || '') !== bundleId));
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0) + 
                   promoItems.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce(
    (sum, item) => {
        const price = item.isPromo || item.bundle_id ? 0 : (item.variant ? item.variant.price : item.product.cena);
        return sum + price * item.quantity;
    },
    0
  ) + (promoItems.length > 0 ? (activePromotion?.ukupna_cena || 0) : 0);

  const promoQuantity = promoItems.reduce((sum, item) => sum + item.quantity, 0);
  const requiredPromoQuantity = activePromotion?.required_items || activePromotion?.potrebna_kolicina || 0;
  const isPromoComplete = activePromotion ? promoQuantity === requiredPromoQuantity : false;

  const shippingCost = totalPrice <= 5000 ? 500 : totalPrice <= 12000 ? 700 : 900;

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        clearPromoItems,
        totalItems,
        totalPrice,
        shippingCost,
        isCartOpen,
        setIsCartOpen,
        activePromotion,
        setActivePromotion,
     setIsPromoPanelOpen,
        isPromoPanelOpen,
        promoPanelStep,
        promoItems,
        addPromoItem,
        removePromoItem,
        removeBundle,
        isPromoComplete,
        promoQuantity,
        requiredPromoQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
 
 export function useCart() {
   const context = useContext(CartContext);
   if (context === undefined) {
     throw new Error("useCart must be used within a CartProvider");
   }
   return context;
 }
