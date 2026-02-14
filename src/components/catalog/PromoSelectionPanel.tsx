import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
import { useCart } from "@/context/CartContext";
import { useAdmin } from "@/context/AdminContext";
import { Product, Variant, CartItem } from "@/types";
import { 
  X, 
  ShoppingBag, 
  CheckCircle2, 
  Plus, 
  Minus,
  Loader2,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export function PromoSelectionPanel() {
  const { 
    activePromotion, 
    isPromoPanelOpen, 
    setIsPromoPanelOpen, 
    promoItems, 
    addPromoItem, 
    removePromoItem,
    removeBundle,
    isPromoComplete,
    promoQuantity,
    requiredPromoQuantity,
    setIsCartOpen,
    promoPanelStep
  } = useCart();
  const { products } = useAdmin();
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, Variant>>({});
  const [currentBundleSelection, setCurrentBundleSelection] = useState<Array<{ product: Product; size?: string; variant?: Variant }>>([]);
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  const hasSteps = !!activePromotion?.steps && Array.isArray(activePromotion.steps) && activePromotion.steps.length > 0;
  const categories = useMemo(() => Array.from(new Set(promoProducts.map(p => p.kategorija))).sort(), [promoProducts]);
  const isCategorical = !hasSteps && categories.length > 1;

  useEffect(() => {
    if (products.length > 0 && activePromotion) {
      if (hasSteps) {
        setPromoProducts(products.filter(p => p.dostupno));
      } else {
        const filtered = products.filter(p => p.promotion_id === activePromotion.id && p.dostupno);
        setPromoProducts(filtered);
      }
    }
  }, [products, activePromotion, hasSteps]);

  // Reset step when promotion changes or populate if editing
  useEffect(() => {
    if (isPromoPanelOpen && hasSteps) {
      // Map promoItems back to steps using stepIndex
      const initialSelection = new Array(activePromotion.steps?.length || 0).fill(null);
      
      if (promoItems.length > 0) {
        promoItems.forEach((item) => {
          if (item.stepIndex !== undefined && item.stepIndex < initialSelection.length) {
            initialSelection[item.stepIndex] = { product: item.product, size: item.size, variant: item.variant };
          }
        });
      }
      
      setCurrentBundleSelection(initialSelection);
      
      // Use the specific step requested by the context
      if (promoPanelStep !== undefined && promoPanelStep < initialSelection.length) {
        setCurrentStep(promoPanelStep);
      } else {
        // Find the first empty step or default to 0
        const firstEmpty = initialSelection.findIndex(s => !s);
        setCurrentStep(firstEmpty === -1 ? 0 : firstEmpty);
      }
    } else if (!isPromoPanelOpen) {
      setCurrentStep(0);
      setCurrentBundleSelection([]);
    }
  }, [isPromoPanelOpen, activePromotion?.id, hasSteps, promoPanelStep]);

  if (!activePromotion || !isPromoPanelOpen) return null;

  const requiredQuantity = hasSteps 
    ? (activePromotion.steps?.length || 0) 
    : requiredPromoQuantity;
  const currentQuantity = hasSteps 
    ? currentBundleSelection.length 
    : promoQuantity;
  const remaining = Math.max(0, requiredQuantity - currentQuantity);

  // Filter products by current category if categorical
  const displayProducts = hasSteps
    ? (() => {
        const step = activePromotion.steps![currentStep];
        if (!step) return [];
        if (step.filter.type === 'category') {
          const allowed = new Set(step.filter.values);
          return promoProducts.filter(p => allowed.has(p.kategorija));
        } else {
          const allowed = new Set(step.filter.values);
          return promoProducts.filter(p => allowed.has(p.id));
        }
      })()
    : (isCategorical 
        ? promoProducts.filter(p => p.kategorija === categories[currentStep])
        : promoProducts);

  // Calculate how many items are selected in the current category
  const currentCategoryQuantity = isCategorical
    ? promoItems
        .filter(item => item.product.kategorija === categories[currentStep])
        .reduce((sum, item) => sum + item.quantity, 0)
    : 0;

  // If categorical, we usually want at least one from each category
  // If required_items matches number of categories, it's 1 per category
  const maxPerCategory = isCategorical && requiredQuantity === categories.length ? 1 : requiredQuantity;

  const canAddMoreInStep = hasSteps 
    ? !currentBundleSelection[currentStep] 
    : currentCategoryQuantity < maxPerCategory;

  const handleNextStep = () => {
    const maxIndex = hasSteps ? requiredQuantity - 1 : categories.length - 1;
    if (currentStep < maxIndex) {
      clearCurrentSelection();
      setCurrentStep(prev => prev + 1);
    }
  };

  const clearCurrentSelection = () => {
    setSelectedVariants({});
    // Lokalni state u StepProductItem će se resetovati jer ćemo dodati key baziran na step-u
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    if (hasSteps) {
      if (activePromotion.id) removeBundle(activePromotion.id);
      currentBundleSelection.forEach((sel, idx) => {
        if (sel) {
          addPromoItem(sel.product, sel.size || "", 1, sel.variant, idx);
        }
      });
    }
    
    setIsPromoPanelOpen(false);
    setIsCartOpen(true);
  };

  const handleSelectStepItem = (product: Product, size?: string, variant?: Variant) => {
    setCurrentBundleSelection(prev => {
      const next = [...prev];
      next[currentStep] = { product, size, variant };
      return next;
    });
    setSelectedProductForModal(null);
    
    // Auto-advance logic
    const maxIndex = hasSteps ? requiredQuantity - 1 : categories.length - 1;
    if (currentStep < maxIndex) {
      setTimeout(() => {
        handleNextStep();
      }, 300); // Mala pauza da korisnik vidi selekciju pre promene
    }
  };

  const activeStep = hasSteps ? activePromotion.steps?.[currentStep] : null;

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-4 py-2 md:py-4 sticky top-0 z-50">
        <div className="container mx-auto">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex flex-col min-w-0 flex-1">
              <h2 className="text-base md:text-xl font-black flex items-center gap-2 truncate">
                <Sparkles className="text-yellow-500 w-4 h-4 md:w-5 md:h-5 shrink-0" />
                <span className="truncate">{activePromotion.naslov}</span>
              </h2>
              {hasSteps ? (
                <div className="flex items-center gap-1.5 mt-1 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                  {activePromotion.steps?.map((step, idx) => {
                    const isDone = !!currentBundleSelection[idx];
                    const isCurrent = idx === currentStep;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          clearCurrentSelection();
                          setCurrentStep(idx);
                        }}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] md:text-[11px] font-bold whitespace-nowrap transition-all shrink-0 ${
                          isDone 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : isCurrent 
                              ? 'bg-yellow-400 text-black shadow-md scale-105' 
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {isDone ? <CheckCircle2 size={12} /> : <span>{idx + 1}</span>}
                        <span className="max-w-[120px] md:max-w-[150px] truncate">
                          {isCurrent ? step.title : step.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[10px] md:text-sm font-bold text-muted-foreground truncate">
                  Izaberite {requiredPromoQuantity} artikala za {activePromotion.ukupna_cena} RSD
                </p>
              )}
            </div>
            
            <button 
              onClick={() => setIsPromoPanelOpen(false)}
              className="p-2 hover:bg-muted rounded-full transition-colors shrink-0"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-600 to-yellow-500"
              initial={{ width: 0 }}
              animate={{ width: `${(currentQuantity / requiredQuantity) * 100}%` }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row container mx-auto">
        {/* Product Grid */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {hasSteps && activeStep && (
            <div className="bg-muted/50 px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-400 text-black text-xs font-black px-2 py-1 rounded">
                  KORAK {currentStep + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base">{activeStep.title}</h3>
                  {activeStep.description && (
                    <p className="text-xs text-muted-foreground">{activeStep.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <ScrollArea className="flex-1 px-2 py-3 md:p-4">
          {promoProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Loader2 className="animate-spin mb-4 text-muted-foreground" size={32} />
              <p className="text-muted-foreground">Učitavanje promo proizvoda...</p>
            </div>
          ) : (
            <motion.div 
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4 pb-40"
            >
              <AnimatePresence mode="popLayout">
                {displayProducts.map((product) => {
                  return hasSteps ? (
                    <StepProductItem
                      key={`${currentStep}-${product.id}`}
                      product={product}
                      canSelect={true}
                      onSelect={(size?: string, variant?: Variant) => handleSelectStepItem(product, size, variant)}
                      selectedVariants={selectedVariants}
                      setSelectedVariants={setSelectedVariants}
                      isSelected={currentBundleSelection[currentStep]?.product.id === product.id}
                    />
                  ) : (
                    <ProductItem 
                      key={`${currentStep}-${product.id}`}
                      product={product}
                      promoItems={promoItems}
                      addPromoItem={addPromoItem}
                      removePromoItem={removePromoItem}
                      isPromoComplete={isPromoComplete}
                      canAddMoreInStep={canAddMoreInStep}
                      isCategorical={isCategorical}
                      selectedVariants={selectedVariants}
                      setSelectedVariants={setSelectedVariants}
                    />
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </ScrollArea>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-80 border-l bg-card p-6 flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <ShoppingBag size={18} />
            Vaš Paket
          </h3>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-3">
              {(!hasSteps && promoItems.length === 0) || (hasSteps && currentBundleSelection.length === 0) ? (
                <div className="text-center py-10">
                  <ShoppingBag className="mx-auto mb-2 text-muted-foreground/30" size={32} />
                  <p className="text-sm text-muted-foreground italic">Paket je prazan</p>
                </div>
              ) : (
                (hasSteps ? currentBundleSelection : promoItems).map((item) => (
                  item && (
                    <motion.div 
                      layout
                      key={item.product.id} 
                      className="flex gap-3 bg-muted/30 p-2 rounded-xl border border-muted"
                    >
                      <img src={item.product.slike[0]} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold line-clamp-1">{item.product.naziv}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex flex-col gap-0.5">
                            {item.size && (
                              <p className="text-[10px] font-bold text-red-600">Veličina: {item.size}</p>
                            )}
                          </div>
                          {item.variant && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">
                              {item.variant.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                ))
              )}
            </div>
          </ScrollArea>
          
          <div className="mt-6 pt-6 border-t space-y-4">
            <div className="flex justify-between items-center font-black">
              <span className="text-muted-foreground">TOTAL:</span>
              <span className="text-xl text-red-600">{activePromotion.ukupna_cena} RSD</span>
            </div>
            
            <div className="flex gap-2">
              {(isCategorical || hasSteps) && (
                <Button 
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 0}
                  className="flex-1"
                >
                  NAZAD
                </Button>
              )}
              {hasSteps ? (
                <div className="flex flex-col gap-2 w-full">
                  {currentStep < requiredQuantity - 1 ? (
                    <Button 
                      onClick={handleNextStep}
                      disabled={!currentBundleSelection[currentStep]}
                      className={`flex-1 font-black transition-all ${
                        currentBundleSelection[currentStep] 
                          ? 'bg-black text-white shadow-lg' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      SLEDEĆI KORAK
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleFinish}
                      disabled={currentBundleSelection.length !== requiredQuantity}
                      className={`flex-1 font-black transition-all ${
                        currentBundleSelection.length === requiredQuantity 
                          ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      ZAVRŠI
                    </Button>
                  )}
                </div>
              ) : isCategorical && currentStep < categories.length - 1 ? (
                <Button 
                  onClick={handleNextStep}
                  className="flex-1 bg-black text-white"
                >
                  DALJE
                </Button>
              ) : (
                <Button 
                  onClick={handleFinish}
                  disabled={!isPromoComplete}
                  className={`flex-1 font-black transition-all ${
                    isPromoComplete 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-200' 
                    : 'bg-muted text-muted-foreground'
                  }`}
                >
                  ZAVRŠI
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Sticky Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-[60] md:hidden">
          <div className="bg-card/95 backdrop-blur-md border-t p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
            <div className="container mx-auto max-w-md">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex flex-col">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status paketa</p>
                  <p className="text-sm font-black">
                    {currentQuantity}/{requiredQuantity} ARTIKALA
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cena akcije</p>
                  <p className="text-base font-black text-red-600">{activePromotion.ukupna_cena} RSD</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {(isCategorical || hasSteps) && (
                  <Button 
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    className="flex-1 h-11 rounded-xl font-bold text-xs"
                  >
                    NAZAD
                  </Button>
                )}
                {hasSteps ? (
                  <div className="flex gap-2 w-full">
                    {currentStep < requiredQuantity - 1 ? (
                      <Button 
                        onClick={handleNextStep}
                        disabled={!currentBundleSelection[currentStep]}
                        className={`flex-[2] h-11 rounded-xl font-black text-xs transition-all ${
                          currentBundleSelection[currentStep] 
                            ? 'bg-black text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        SLEDEĆI KORAK
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleFinish}
                        disabled={currentBundleSelection.length !== requiredQuantity}
                        className={`flex-[2] h-11 rounded-xl font-black text-xs transition-all ${
                          currentBundleSelection.length === requiredQuantity 
                            ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {currentBundleSelection.length === requiredQuantity ? 'POTVRDI PAKET' : `POPUNI JOŠ ${remaining}`}
                      </Button>
                    )}
                  </div>
                ) : isCategorical && currentStep < categories.length - 1 ? (
                  <Button 
                    onClick={handleNextStep}
                    className="flex-[2] h-11 rounded-xl bg-black text-white font-black text-xs"
                  >
                    SLEDEĆI KORAK
                  </Button>
                ) : (
                  <Button 
                    onClick={handleFinish}
                    disabled={!isPromoComplete}
                    className={`flex-[2] h-11 rounded-xl font-black text-xs transition-all ${
                      isPromoComplete 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/20' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPromoComplete ? 'POTVRDI PAKET' : `DODAJ JOŠ ${remaining}`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StepProductItem({
  product,
  canSelect,
  onSelect,
  selectedVariants,
  setSelectedVariants,
  isSelected
}: {
  product: Product;
  canSelect: boolean;
  onSelect: (size?: string, variant?: Variant) => void;
  selectedVariants: Record<string, Variant>;
  setSelectedVariants: Dispatch<SetStateAction<Record<string, Variant>>>;
  isSelected?: boolean;
}) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const hasVariants = product.varijante && product.varijante.length > 0;
  const hasSizes = product.velicine && product.velicine.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`relative group bg-card border md:border-2 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${
        isSelected 
          ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20' 
          : !canSelect 
            ? 'opacity-60' 
            : 'border-transparent hover:border-muted-foreground/20'
      }`}
    >
      <div className="relative h-32 sm:h-auto sm:aspect-[4/5]">
        <img 
          src={product.slike[0]} 
          alt={product.naziv}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center shadow-lg z-10">
            <CheckCircle2 size={16} className="md:w-5 md:h-5" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 md:p-3">
          <p className="text-white text-[10px] md:text-xs font-bold truncate leading-tight">{product.naziv}</p>
        </div>
      </div>
      
      <div className="p-2 md:p-3 bg-card space-y-2 md:space-y-3">
        {hasSizes && (
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground">Veličina:</p>
            <div className="flex flex-wrap gap-1">
              {product.velicine?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[28px] md:min-w-[32px] h-6 md:h-7 px-1.5 text-[9px] md:text-[10px] font-bold rounded border transition-all ${
                    selectedSize === size
                      ? 'bg-black text-white border-black'
                      : 'bg-muted hover:border-black/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasVariants && (
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground">Stil:</p>
            <div className="flex flex-wrap gap-1">
              {product.varijante?.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setSelectedVariants((prev) => ({ ...prev, [product.id]: v }))}
                  className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[9px] md:text-[10px] font-bold rounded border transition-all ${
                    selectedVariants[product.id]?.name === v.name
                      ? 'bg-black text-white border-black'
                      : 'bg-muted hover:border-black/30'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <Button 
          onClick={() => onSelect(selectedSize, selectedVariants[product.id])}
          disabled={!canSelect || (hasVariants && !selectedVariants[product.id]) || (hasSizes && !selectedSize) || isSelected}
          className={`w-full font-bold h-8 md:h-9 rounded-lg md:rounded-xl transition-all text-[10px] md:text-xs ${
            isSelected
              ? 'bg-emerald-500/20 text-emerald-600 border-2 border-emerald-500/20'
              : (hasVariants && !selectedVariants[product.id]) || (hasSizes && !selectedSize) || !canSelect
                ? 'bg-muted text-muted-foreground' 
                : 'bg-black text-white hover:bg-black/90'
          }`}
        >
          {isSelected 
            ? 'IZABRANO'
            : hasVariants && !selectedVariants[product.id] 
              ? 'STIL' 
              : hasSizes && !selectedSize
                ? 'VELIČINA'
                : 'IZABERI'
          }
        </Button>
      </div>
    </motion.div>
  );
}

function ProductItem({ 
  product, 
  promoItems, 
  addPromoItem, 
  removePromoItem, 
  isPromoComplete, 
  canAddMoreInStep, 
  isCategorical, 
  selectedVariants, 
  setSelectedVariants 
}: { 
  product: Product; 
  promoItems: CartItem[]; 
  addPromoItem: (product: Product, size: string, quantity?: number, variant?: Variant) => void; 
  removePromoItem: (productId: string, size: string) => void; 
  isPromoComplete: boolean; 
  canAddMoreInStep: boolean; 
  isCategorical: boolean; 
  selectedVariants: Record<string, Variant>; 
  setSelectedVariants: Dispatch<SetStateAction<Record<string, Variant>>>; 
}) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const selectedQty = promoItems.filter(item => item.product.id === product.id).reduce((sum, i) => sum + i.quantity, 0);
  const hasVariants = product.varijante && product.varijante.length > 0;
  const hasSizes = product.velicine && product.velicine.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      layout
      className={`relative group bg-card border md:border-2 rounded-xl md:rounded-2xl overflow-hidden transition-all duration-300 ${
        selectedQty > 0 ? 'border-red-500 shadow-lg' : 'border-transparent hover:border-muted-foreground/20'
      }`}
    >
      <div className="relative h-32 sm:h-auto sm:aspect-[4/5]">
        <img 
          src={product.slike[0]} 
          alt={product.naziv}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        {selectedQty > 0 && (
          <div className="absolute top-1.5 right-1.5 bg-red-600 text-white w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-lg z-10">
            {selectedQty}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2 md:p-3">
          <p className="text-white text-[10px] md:text-xs font-bold truncate leading-tight">{product.naziv}</p>
        </div>
      </div>
      
      <div className="p-2 md:p-3 bg-card space-y-2 md:space-y-3">
        {/* Veličine */}
        {hasSizes && (
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground">Veličina:</p>
            <div className="flex flex-wrap gap-1">
              {product.velicine?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`min-w-[28px] md:min-w-[32px] h-6 md:h-7 px-1.5 text-[9px] md:text-[10px] font-bold rounded border transition-all ${
                    selectedSize === size
                      ? 'bg-black text-white border-black'
                      : 'bg-muted hover:border-black/30'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {hasVariants && (
          <div className="space-y-1">
            <p className="text-[9px] md:text-[10px] uppercase font-bold text-muted-foreground">Stil:</p>
            <div className="flex flex-wrap gap-1">
              {product.varijante?.map((v) => (
                <button
                  key={v.name}
                  onClick={() => setSelectedVariants((prev) => ({ ...prev, [product.id]: v }))}
                  className={`px-1.5 py-0.5 md:px-2 md:py-1 text-[9px] md:text-[10px] font-bold rounded border transition-all ${
                    selectedVariants[product.id]?.name === v.name
                      ? 'bg-black text-white border-black'
                      : 'bg-muted hover:border-black/30'
                  }`}
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          {selectedQty > 0 ? (
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2 bg-muted rounded-lg md:rounded-xl p-1 w-full h-8 md:h-9">
                <button 
                  onClick={() => removePromoItem(product.id, selectedSize)}
                  className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors"
                >
                  <Minus size={12} className="md:w-3.5 md:h-3.5" />
                </button>
                <span className="flex-1 text-center font-bold text-[11px] md:text-sm">
                  {promoItems.find(item => item.product.id === product.id && item.size === selectedSize)?.quantity || selectedQty}
                </span>
                <button 
                  onClick={() => addPromoItem(product, selectedSize, 1, selectedVariants[product.id])}
                  disabled={isPromoComplete || !canAddMoreInStep || (hasSizes && !selectedSize)}
                  className="w-6 h-6 md:w-7 md:h-7 flex items-center justify-center hover:bg-background rounded-md transition-colors disabled:opacity-30"
                >
                  <Plus size={12} className="md:w-3.5 md:h-3.5" />
                </button>
              </div>
              {hasSizes && !selectedSize && selectedQty > 0 && (
                <p className="text-[8px] md:text-[9px] text-center text-red-500 font-bold">Izaberi veličinu za +/-</p>
              )}
            </div>
          ) : (
            <Button 
              onClick={() => addPromoItem(product, selectedSize, 1, selectedVariants[product.id])}
              disabled={isPromoComplete || (hasVariants && !selectedVariants[product.id]) || (hasSizes && !selectedSize) || !canAddMoreInStep}
              className={`w-full font-bold h-8 md:h-9 rounded-lg md:rounded-xl transition-all text-[10px] md:text-xs ${
                (hasVariants && !selectedVariants[product.id]) || (hasSizes && !selectedSize) || !canAddMoreInStep
                ? 'bg-muted text-muted-foreground' 
                : 'bg-black text-white hover:bg-black/90'
              }`}
            >
              {hasVariants && !selectedVariants[product.id] 
                ? 'STIL' 
                : hasSizes && !selectedSize
                  ? 'VELIČINA'
                  : !canAddMoreInStep && isCategorical 
                    ? 'MAX' 
                    : 'DODAJ'
              }
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
