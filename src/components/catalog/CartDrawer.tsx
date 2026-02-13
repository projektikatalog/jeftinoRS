 import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Trash2, ShoppingBag, CheckCircle, Loader2 } from "lucide-react";
import { TermsOfServiceModal, PrivacyPolicyModal } from "./LegalModals";
import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";
import { CustomerInfo } from "@/types";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export function CartDrawer() {
  const { 
    items, 
    isCartOpen, 
    setIsCartOpen, 
    totalPrice, 
    shippingCost,
    updateQuantity, 
    removeFromCart, 
    clearCart,
    promoItems,
    addPromoItem,
    removePromoItem,
    activePromotion,
    removeBundle,
    isPromoComplete,
    promoQuantity,
    requiredPromoQuantity,
    setIsPromoPanelOpen
  } = useCart();
  const { addOrder, getSetting } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CustomerInfo>({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    postalCode: "",
    phone: "",
    email: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string) => {
    const trimmed = value.trim();
    const required = ["firstName", "lastName", "address", "city", "phone"];
    
    if (required.includes(name) && trimmed.length === 0) return "Ovo polje je obavezno";

    if (name === "firstName") {
      if (/\d/.test(value)) return "Ime ne može sadržati brojeve";
      if (trimmed.length < 2) return "Ime mora imati bar 2 karaktera";
      const letters = /^[\p{L}\s]+$/u;
      if (!letters.test(trimmed)) return "Dozvoljena samo slova";
    }

    if (name === "lastName") {
      if (/\d/.test(value)) return "Prezime ne može sadržati brojeve";
      if (trimmed.length < 2) return "Prezime mora imati bar 2 karaktera";
      const letters = /^[\p{L}\s]+$/u;
      if (!letters.test(trimmed)) return "Dozvoljena samo slova";
    }

    if (name === "city") {
      if (trimmed.length < 2) return "Grad mora imati bar 2 slova";
    }

    if (name === "address") {
      const hasNumber = /\d/.test(value);
      if (!hasNumber) return "Molimo unesite i broj zgrade ili kuće";
      if (trimmed.length < 3) return "Adresa je prekratka";
    }

    if (name === "phone") {
      if (/[A-Za-z\p{L}]/u.test(value)) return "Telefon mora biti u formatu 06XXXXXXXX";
      if (!/^[0-9+]+$/.test(value.replace(/\s/g, ""))) return "Telefon mora biti u formatu 06XXXXXXXX";
      const digits = value.replace(/\D/g, "").length;
      if (digits < 9) return "Telefon mora imati bar 9 cifara";
    }

    if (name === "email") {
      if (trimmed.length === 0) return "";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Molimo unesite ispravan email";
    }
    return "";
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let { name, value } = e.target;

    // Auto-fix for firstName and lastName (Capitalize first letter of each word)
    if (name === "firstName" || name === "lastName") {
      if (value.length > 0) {
        value = value.toLowerCase().replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
      }
    }

    // Phone restriction (only numbers and +)
    if (name === "phone") {
      const lastChar = value.slice(-1);
      if (value.length > 0 && !/[0-9+]/.test(lastChar)) {
        // If the last character is invalid, don't update if it's not a backspace
        // But since this is onChange, we just filter it
        value = value.replace(/[^0-9+]/g, "");
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'phone'] as const;
    const allValidRequired = requiredFields.every((field) => validateField(field, String(formData[field])) === "");
    const emailValid = validateField('email', String(formData.email || "")) === "";
    return allValidRequired && emailValid;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price) + " RSD";
  };

  const sanitizeFormData = (data: CustomerInfo) => {
    return {
      ...data,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      postalCode: data.postalCode.trim(),
      phone: data.phone.replace(/\s+/g, "").trim(),
      email: (data.email || "").trim(),
    };
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    const requiredFields = ['firstName', 'lastName', 'address', 'city', 'phone'];
    
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof CustomerInfo]);
      if (error) {
        newErrors[field] = error;
      }
    });
    const emailError = validateField('email', formData.email || "");
    if (emailError) newErrors['email'] = emailError;

    setErrors(newErrors);
    setTouched(requiredFields.reduce((acc, field) => ({ ...acc, [field]: true }), { email: true }));

    if (Object.keys(newErrors).length > 0) {
      toast({
        title: "Greška u formi",
        description: "Molimo Vas ispravite greške pre slanja porudžbine.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    setShowConfirmPopup(true);
  };

  const handleFinalSubmitOrder = async () => {
    setShowConfirmPopup(false);
    setIsSubmitting(true);
    
    const cleaned = sanitizeFormData(formData);
    const orderData = {
      ime_kupca: `${cleaned.firstName} ${cleaned.lastName}`,
      email_kupca: cleaned.email || "N/A",
      adresa_kupca: cleaned.address,
      grad_kupca: cleaned.city,
      postanski_broj_kupca: cleaned.postalCode,
      telefon_kupca: cleaned.phone,
      artikli: [...items, ...promoItems],
      ukupna_cena: totalPrice,
      shipping_cost: shippingCost,
      status: "Primljeno" as const,
      promo_title: promoItems.length > 0 ? activePromotion?.naslov : null,
      promo_price: promoItems.length > 0 ? activePromotion?.ukupna_cena : null,
      promotion_id: promoItems.length > 0 ? activePromotion?.id : null,
    };

    const { data: orderResponse, error } = await addOrder(orderData);

    if (!error) {
      // 1. Send Telegram notification
      try {
        const orderId = orderResponse?.[0]?.id || "N/A";
        const orderCode = orderResponse?.[0]?.order_code || orderId;

        await supabase.functions.invoke('telegram-notification', {
          body: { 
            order: { 
              ...orderData, 
              id: orderId, 
              order_code: orderCode 
            } 
          },
        });
      } catch (tgError) {
        console.error("Failed to send Telegram notification via Edge Function:", tgError);
      }

      setOrderComplete(true);
      clearCart();
      setIsSubmitting(false);
      
      // 2. Redirect to Success page
      navigate('/success');
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        postalCode: "",
        phone: "",
        email: "",
      });
      setShowCheckout(false);
      setIsCartOpen(false);
      setOrderComplete(false); 
    } else {
      console.error("Error creating order:", error);
      setIsSubmitting(false);
    }
  };
 
   return (
     <AnimatePresence>
       {isCartOpen && (
         <>
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={() => setIsCartOpen(false)}
             className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
           />
           <motion.div
             initial={{ opacity: 0, x: "100%" }}
             animate={{ opacity: 1, x: 0 }}
             exit={{ opacity: 0, x: "100%" }}
             transition={{ type: "spring", damping: 25, stiffness: 300 }}
             className="fixed top-0 right-0 bottom-0 w-full md:w-[450px] bg-card border-l border-border z-50 flex flex-col"
           >
             <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <ShoppingBag size={20} className="text-primary" />
                 <h2 className="text-lg font-semibold">
                   {showCheckout ? "Checkout" : "Korpa"}
                 </h2>
               </div>
               <button
                 onClick={() => setIsCartOpen(false)}
                 className="p-2 hover:bg-muted rounded-full transition-colors"
               >
                 <X size={20} />
               </button>
             </div>
 
             <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {orderComplete ? (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center justify-center h-full text-center space-y-4"
                 >
                   <CheckCircle size={64} className="text-success" />
                   <h3 className="text-2xl font-semibold">Hvala Vam!</h3>
                   <p className="text-muted-foreground">
                    Porudžbina je uspešno poslata! Prodavac će Vas kontaktirati uskoro.
                  </p>
                 </motion.div>
               ) : showCheckout ? (
                <form onSubmit={handleSubmitOrder} className="space-y-4" noValidate>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ime <span className="text-destructive">*</span></label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                          errors.firstName ? "border-destructive focus:ring-destructive/50" : "border-border"
                        }`}
                      />
                      {errors.firstName && <p className="text-destructive text-xs">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Prezime <span className="text-destructive">*</span></label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                          errors.lastName ? "border-destructive focus:ring-destructive/50" : "border-border"
                        }`}
                      />
                      {errors.lastName && <p className="text-destructive text-xs">{errors.lastName}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Adresa <span className="text-destructive">*</span></label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.address ? "border-destructive focus:ring-destructive/50" : "border-border"
                      }`}
                    />
                    {errors.address && <p className="text-destructive text-xs">{errors.address}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grad <span className="text-destructive">*</span></label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                          errors.city ? "border-destructive focus:ring-destructive/50" : "border-border"
                        }`}
                      />
                      {errors.city && <p className="text-destructive text-xs">{errors.city}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Poštanski broj</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email <span className="text-muted-foreground">(opciono)</span></label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.email ? "border-destructive focus:ring-destructive/50" : "border-border"
                      }`}
                    />
                    {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Broj telefona <span className="text-destructive">*</span></label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        errors.phone ? "border-destructive focus:ring-destructive/50" : "border-border"
                      }`}
                    />
                    {errors.phone && <p className="text-destructive text-xs">{errors.phone}</p>}
                  </div>
 
                   <div className="pt-4 border-t border-border">
                     <div className="space-y-2 mb-4">
                       <div className="flex justify-between text-sm">
                         <span>Cena artikala:</span>
                         <span className="font-medium">{formatPrice(totalPrice)}</span>
                       </div>
                       <div className="flex justify-between text-sm">
                         <span>Poštarina:</span>
                         <span className="font-medium">{formatPrice(shippingCost)}</span>
                       </div>
                       <div className="flex justify-between text-lg font-semibold">
                         <span>UKUPNO:</span>
                         <span className="price-highlight">{formatPrice(totalPrice + shippingCost)}</span>
                       </div>
                     </div>
                     <motion.button
                      type="submit"
                      disabled={isSubmitting || !isFormValid()}
                      whileHover={{ scale: (isSubmitting || !isFormValid()) ? 1 : 1.02 }}
                      whileTap={{ scale: (isSubmitting || !isFormValid()) ? 1 : 0.98 }}
                      className="w-full py-4 cta-button rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2 justify-center">
                          <Loader2 className="animate-spin" /> Obrađujemo...
                        </span>
                      ) : (
                        "NARUČI"
                      )}
                    </motion.button>
                   </div>
                 </form>
               ) : items.length === 0 && promoItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <ShoppingBag size={48} className="text-muted-foreground" />
                    <p className="text-muted-foreground">Vaša korpa je prazna.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Promo Items Section */}
            {promoItems.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                          <div className="flex items-center gap-2">
                            <CheckCircle size={16} className={isPromoComplete ? "text-emerald-500" : "text-yellow-500"} />
                            <span className={`text-xs font-bold uppercase tracking-wider ${isPromoComplete ? "text-emerald-600" : "text-yellow-600"}`}>
                              Aktivna Akcija: {activePromotion?.naslov}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setIsCartOpen(false);
                              setIsPromoPanelOpen(true);
                            }}
                            className="text-[10px] font-bold text-primary hover:underline uppercase"
                          >
                            Izmeni
                          </button>
                        </div>

                        {!isPromoComplete && activePromotion && (
                           <div className="mx-1 p-3 bg-yellow-50 border border-yellow-100 rounded-lg space-y-2">
                             <p className="text-xs font-medium text-yellow-800">
                               💡 Fali vam još { requiredPromoQuantity - promoQuantity } artikala da biste ostvarili ovu akciju!
                             </p>
                             {activePromotion.steps && activePromotion.steps.length > 0 && (
                               <div className="flex flex-wrap gap-2">
                                 {activePromotion.steps.map((step, idx) => {
                                   const isStepDone = promoItems.some(item => item.stepIndex === idx);
                                   if (isStepDone) return null;
                                   return (
                                     <button
                                       key={idx}
                                       onClick={() => {
                                         setIsCartOpen(false);
                                         setIsPromoPanelOpen(true, idx);
                                       }}
                                       className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded hover:bg-yellow-200 transition-colors uppercase"
                                     >
                                       Popuni: {step.title}
                                     </button>
                                   );
                                 })}
                               </div>
                             )}
                           </div>
                         )}
                        
                        {[...promoItems]
                          .sort((a, b) => (a.stepIndex ?? 0) - (b.stepIndex ?? 0))
                          .map((item) => (
                          <motion.div
                            key={`promo-${item.product.id}-${item.stepIndex ?? 'no-step'}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-4 p-4 bg-emerald-50/50 rounded-lg border border-emerald-100"
                          >
                            <img
                              src={item.product.slike[0]}
                              alt={item.product.naziv}
                              className="w-16 h-20 object-cover rounded-md"
                            />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium text-sm">{item.product.naziv}</h4>
                                {item.stepIndex !== undefined && activePromotion?.steps?.[item.stepIndex] && (
                                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">
                                    KORAK {item.stepIndex + 1}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-muted-foreground">Količina: {item.quantity}</p>
                                  {!activePromotion?.steps?.length && (
                                    <div className="flex items-center gap-1 ml-2">
                                      <button
                                        onClick={() => removePromoItem(item.product.id, item.size, item.stepIndex)}
                                        className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors"
                                      >
                                        <Minus size={10} />
                                      </button>
                                      <button
                                        onClick={() => addPromoItem(item.product, item.size, 1, item.variant, item.stepIndex)}
                                        disabled={isPromoComplete}
                                        className="w-5 h-5 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors disabled:opacity-30"
                                      >
                                        <Plus size={10} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                {item.size && (
                                  <p className="text-[10px] font-bold text-red-600">Veličina: {item.size}</p>
                                )}
                                {item.variant && (
                                  <p className="text-[10px] text-muted-foreground italic">Stil: {item.variant.name}</p>
                                )}
                              </div>
                              <div className="mt-2 flex justify-between items-center">
                                <span className="text-xs font-bold text-emerald-600 uppercase">Promo artikal</span>
                                <button
                                  onClick={() => {
                                    removePromoItem(item.product.id, item.size, item.stepIndex);
                                  }}
                                  className="text-destructive hover:bg-destructive/10 p-1 rounded"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                        <div className="px-4 py-2 bg-emerald-100/50 rounded-lg flex justify-between items-center">
                          <span className="text-sm font-bold">Cena paketa:</span>
                          <span className="font-black text-emerald-700">{formatPrice(activePromotion?.ukupna_cena || 0)}</span>
                        </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => activePromotion?.id && removeBundle(activePromotion.id)}
                    className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded"
                  >
                    Obriši ceo paket
                  </button>
                </div>
                        <div className="h-px bg-border my-4" />
                      </div>
                    )}

                    {/* Regular Items Section */}
                    {items.map((item) => (
                      <motion.div
                        key={`${item.product.id}-${item.size}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex gap-4 p-4 bg-secondary/50 rounded-lg border border-border"
                      >
                      <img
                        src={item.product.slike[0]}
                        alt={item.product.naziv}
                        className="w-20 h-24 object-cover rounded-md"
                      />
                      <div className="flex-1 space-y-2">
                        <h4 className="font-medium text-sm">{item.product.naziv}</h4>
                        <p className="text-xs text-muted-foreground">
                          {item.variant ? "Varijanta: " : "Veličina: "}{item.size}
                        </p>
                        <p className="text-sm font-semibold price-highlight">
                          {formatPrice(item.variant ? item.variant.price : item.product.cena)}
                        </p>
                      <div className="flex items-center gap-2">
                         <button
                           onClick={() =>
                             updateQuantity(item.product.id, item.size, item.quantity - 1)
                           }
                           className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors"
                         >
                           <Minus size={14} />
                         </button>
                         <span className="text-sm w-6 text-center">{item.quantity}</span>
                         <button
                           onClick={() =>
                             updateQuantity(item.product.id, item.size, item.quantity + 1)
                           }
                           className="w-7 h-7 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors"
                         >
                           <Plus size={14} />
                         </button>
                         <button
                           onClick={() => removeFromCart(item.product.id, item.size)}
                           className="ml-auto p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                         >
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   </motion.div>
                 ))}
                 
                 {(items.length > 0 || promoItems.length > 0) && (
                   <motion.button
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     onClick={() => {
                       setIsCartOpen(false);
                       const productsElement = document.getElementById('products');
                       if (productsElement) {
                         productsElement.scrollIntoView({ behavior: 'smooth' });
                       }
                     }}
                     className="w-full py-4 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all flex items-center justify-center gap-2 group mt-2"
                   >
                     <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                     DODAJ JOŠ PROIZVODA
                   </motion.button>
                 )}
                  </div>
                )}
              </div>

              {!orderComplete && (items.length > 0 || promoItems.length > 0) && !showCheckout && (
               <div className="border-t border-border p-4 space-y-4 bg-card">
                 <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                     <span>Cena artikala:</span>
                     <span className="font-medium">{formatPrice(totalPrice)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span>Poštarina:</span>
                     <span className="font-medium">{formatPrice(shippingCost)}</span>
                   </div>
                   <div className="flex justify-between text-lg font-semibold">
                     <span>UKUPNO:</span>
                     <span className="price-highlight">{formatPrice(totalPrice + shippingCost)}</span>
                   </div>
                 </div>
                 <motion.button
                   whileHover={{ scale: (promoItems.length > 0 && !isPromoComplete) ? 1 : 1.02 }}
                   whileTap={{ scale: (promoItems.length > 0 && !isPromoComplete) ? 1 : 0.98 }}
                   onClick={() => setShowCheckout(true)}
                   disabled={promoItems.length > 0 && !isPromoComplete}
                   className="w-full py-4 cta-button rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {promoItems.length > 0 && !isPromoComplete ? "KOMPLETIRAJTE AKCIJU" : "NASTAVI KA PLAĆANJU"}
                 </motion.button>
                 <button
                   onClick={() => setIsCartOpen(false)}
                   className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                 >
                   Nastavi kupovinu
                 </button>
               </div>
             )}
 
             {showCheckout && !orderComplete && (
               <div className="border-t border-border p-4 bg-card">
                 <button
                   onClick={() => setShowCheckout(false)}
                   className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
                 >
                   ← Nazad na korpu
                 </button>
               </div>
             )}
           </motion.div>
         </>
       )}
       <TermsOfServiceModal 
         isOpen={isTermsOpen} 
         onClose={() => setIsTermsOpen(false)} 
       />
       <PrivacyPolicyModal 
         isOpen={isPrivacyOpen} 
         onClose={() => setIsPrivacyOpen(false)} 
       />

       {/* Confirmation Popup */}
       <AnimatePresence>
         {showConfirmPopup && (
           <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
             <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowConfirmPopup(false)}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div
               initial={{ opacity: 0, scale: 0.9, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.9, y: 20 }}
               className="relative w-full max-w-sm bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10"
             >
               <div className="p-6 space-y-6">
                 <div className="text-center space-y-2">
                   <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                     <CheckCircle className="text-primary w-8 h-8" />
                   </div>
                   <h3 className="text-xl font-black uppercase tracking-tight">Da li su svi podaci tačni?</h3>
                   <p className="text-sm text-muted-foreground">Proverite još jednom vaše podatke pre slanja porudžbine.</p>
                 </div>

                 <div className="bg-secondary/30 rounded-2xl p-4 space-y-3">
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Kupac:</span>
                     <span className="font-bold">{formData.firstName} {formData.lastName}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Adresa:</span>
                     <span className="font-bold text-right">{formData.address}, {formData.city}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                     <span className="text-muted-foreground">Telefon:</span>
                     <span className="font-bold">{formData.phone}</span>
                   </div>
                   <div className="pt-2 border-t border-border/50 flex justify-between text-base">
                     <span className="font-bold">Ukupno:</span>
                     <span className="font-black text-primary">{formatPrice(totalPrice + shippingCost)}</span>
                   </div>
                 </div>

                 <div className="flex flex-col gap-3">
                   <motion.button
                     whileHover={{ scale: 1.02 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={handleFinalSubmitOrder}
                     className="w-full py-4 gold-gradient text-primary-foreground rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-gold/20"
                   >
                     POTVRDI I NARUČI
                   </motion.button>
                   <button
                     onClick={() => setShowConfirmPopup(false)}
                     className="w-full py-3 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                   >
                     IZMENI PODATKE
                   </button>
                 </div>
               </div>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </AnimatePresence>
   );
 }
