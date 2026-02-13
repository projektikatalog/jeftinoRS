import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, ArrowLeft, Save, X, ToggleLeft, ToggleRight, CheckSquare, Square, Search, Image as ImageIcon, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/context/AdminContext";
import imageCompression from 'browser-image-compression';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Promotion, Product, BundleStep } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export default function AdminPromotions() {
  const { promotions, addPromotion, updatePromotion, deletePromotion, products, updateProduct, uploadImage } = useAdmin();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    naslov: "",
    potrebna_kolicina: 4,
    required_items: 4,
    ukupna_cena: 7000,
    aktivna: true,
    promo_image_url: "",
    steps: [] as BundleStep[],
  });

  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  useEffect(() => {
    if (editingPromo) {
      const assigned = products.filter(p => p.promotion_id === editingPromo.id).map(p => p.id);
      setSelectedProductIds(assigned);
    } else {
      setSelectedProductIds([]);
    }
  }, [editingPromo, products]);

  const resetForm = () => {
    setFormData({
      naslov: "",
      potrebna_kolicina: 4,
      required_items: 4,
      ukupna_cena: 7000,
      aktivna: true,
      promo_image_url: "",
      steps: [],
    });
    setEditingPromo(null);
    setIsFormOpen(false);
    setSelectedProductIds([]);
    setUploading(false);
  };

  const handleEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setFormData({
      naslov: promo.naslov,
      potrebna_kolicina: promo.potrebna_kolicina,
      required_items: promo.required_items || promo.potrebna_kolicina,
      ukupna_cena: promo.ukupna_cena,
      aktivna: promo.aktivna,
      promo_image_url: promo.promo_image_url || "",
      steps: promo.steps || [],
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let promoId = editingPromo?.id;

    const dataToSave = {
      ...formData,
      required_items: (formData.steps && formData.steps.length > 0) ? formData.steps.length : formData.required_items,
      potrebna_kolicina: (formData.steps && formData.steps.length > 0) ? formData.steps.length : formData.required_items,
    };

    if (editingPromo) {
      await updatePromotion(editingPromo.id, dataToSave);
    } else {
      const { data, error } = await addPromotion(dataToSave);
      if (!error && data && data.length > 0) {
        promoId = data[0].id;
      }
    }

    // Update products association (Bulk Link)
    if (promoId) {
      // 1. Unassign products that are no longer selected
      const previouslyAssigned = products.filter(p => p.promotion_id === promoId);
      for (const p of previouslyAssigned) {
        if (!selectedProductIds.includes(p.id)) {
          await updateProduct(p.id, { promotion_id: undefined, is_promo: false });
        }
      }

      // 2. Assign newly selected products
      for (const productId of selectedProductIds) {
        const product = products.find(p => p.id === productId);
        if (product && product.promotion_id !== promoId) {
          await updateProduct(productId, { 
            promotion_id: promoId, 
            is_promo: true,
            // Automatically set only_bundle if requested or as a default for promo items?
            // The user said: "If product has only_bundle: true, it shouldn't be in regular grid".
            // Let's keep existing only_bundle value or we could potentially add a toggle.
          });
        }
      }
    }

    resetForm();
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploading(true);
      const file = e.target.files[0];
      
      const compressionOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };

      try {
        const compressedFile = await imageCompression(file, compressionOptions);
        const url = await uploadImage(compressedFile);
        if (url) {
          setFormData(prev => ({ ...prev, promo_image_url: url }));
        }
      } catch (error) {
        console.error("Compression failed:", error);
        const url = await uploadImage(file);
        if (url) {
          setFormData(prev => ({ ...prev, promo_image_url: url }));
        }
      } finally {
        setUploading(false);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.naziv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.kategorija.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(products.map(p => p.kategorija))).sort();

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          title: `Korak ${prev.steps.length + 1}`,
          filter: { type: 'category', values: [] }
        }
      ]
    }));
  };

  const updateStep = (index: number, updated: Partial<BundleStep>) => {
    setFormData(prev => {
      const steps = [...prev.steps];
      steps[index] = { ...steps[index], ...updated } as BundleStep;
      return { ...prev, steps };
    });
  };

  const updateStepFilterType = (index: number, type: 'category' | 'product') => {
    setFormData(prev => {
      const steps = [...prev.steps];
      const current = steps[index];
      steps[index] = { 
        ...current, 
        filter: { type, values: [] } 
      };
      return { ...prev, steps };
    });
  };

  const toggleStepFilterValue = (index: number, value: string) => {
    setFormData(prev => {
      const steps = [...prev.steps];
      const current = steps[index];
      const values = current.filter.values.includes(value)
        ? current.filter.values.filter(v => v !== value)
        : [...current.filter.values, value];
      steps[index] = { 
        ...current, 
        filter: { ...current.filter, values } 
      };
      return { ...prev, steps };
    });
  };

  const removeStep = (index: number) => {
    setFormData(prev => {
      const steps = [...prev.steps];
      steps.splice(index, 1);
      return { ...prev, steps };
    });
  };

  const confirmDelete = async () => {
    if (promoToDelete) {
      await deletePromotion(promoToDelete);
      setPromoToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("sr-RS").format(price) + " RSD";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="text-xl font-semibold">Upravljanje Promocijama</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2 gold-gradient rounded-lg font-medium text-sm text-primary-foreground shadow-gold"
            >
              <Plus size={18} />
              Nova Akcija
            </motion.button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {promotions.map((promo) => (
              <motion.div
                key={promo.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                  !promo.aktivna ? "opacity-60" : ""
                }`}
              >
                {promo.promo_image_url && (
                  <div className="aspect-video w-full overflow-hidden border-b">
                    <img src={promo.promo_image_url} alt={promo.naslov} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg leading-tight">{promo.naslov}</h3>
                    <div
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        promo.aktivna
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {promo.aktivna ? "Aktivna" : "Neaktivna"}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs mb-1">Potrebno artikala</p>
                    <p className="font-semibold">{promo.required_items || promo.potrebna_kolicina} kom</p>
                    </div>
                    <div className="bg-secondary/50 p-3 rounded-lg">
                      <p className="text-muted-foreground text-xs mb-1">Cena paketa</p>
                      <p className="font-semibold text-primary">{formatPrice(promo.ukupna_cena)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-secondary hover:bg-muted rounded-lg text-sm font-medium transition-colors"
                    >
                      <Pencil size={16} />
                      Izmeni
                    </button>
                    <button
                      onClick={() => setPromoToDelete(promo.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {promotions.length === 0 && !isFormOpen && (
          <div className="text-center py-20">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus size={32} className="text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nema kreiranih akcija</h3>
            <p className="text-muted-foreground">Kliknite na 'Nova Akcija' da započnete.</p>
          </div>
        )}
      </main>

      {/* Form Dialog */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetForm}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-5xl max-h-full bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {editingPromo ? "Izmeni Akciju" : "Nova Akcija"}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-auto">
                <form onSubmit={handleSubmit} id="promo-form" className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Osnovne Informacije</h3>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Naslov akcije</label>
                      <input
                        type="text"
                        required
                        value={formData.naslov}
                        onChange={(e) => setFormData({ ...formData, naslov: e.target.value })}
                        className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="npr. TORBICA + DUKS = 3500 RSD"
                      />
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <ImageIcon size={16} />
                        Slika akcije
                      </label>
                      
                      {formData.promo_image_url ? (
                        <div className="relative aspect-video rounded-xl overflow-hidden border border-border group">
                          <img 
                            src={formData.promo_image_url} 
                            className="w-full h-full object-cover" 
                            alt="Promo preview" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <label className="p-2 bg-white text-black rounded-full cursor-pointer hover:scale-110 transition-transform">
                              <Upload size={20} />
                              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                            <button 
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, promo_image_url: "" }))}
                              className="p-2 bg-white text-destructive rounded-full hover:scale-110 transition-transform"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`flex flex-col items-center justify-center aspect-video rounded-xl border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload size={32} className="mb-2 text-muted-foreground" />
                          <span className="text-sm font-medium text-muted-foreground">
                            {uploading ? "Otpremanje..." : "Kliknite za otpremanje slike"}
                          </span>
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                        </label>
                      )}
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Ili unesite URL slike</label>
                        <input
                          type="url"
                          value={formData.promo_image_url}
                          onChange={(e) => setFormData({ ...formData, promo_image_url: e.target.value })}
                          className="w-full px-4 py-2 bg-input border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/50"
                          placeholder="https://..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Broj artikala</label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={formData.required_items}
                          onChange={(e) =>
                            setFormData({ ...formData, required_items: parseInt(e.target.value) })
                          }
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Fiksna cena (RSD)</label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.ukupna_cena}
                          onChange={(e) =>
                            setFormData({ ...formData, ukupna_cena: parseInt(e.target.value) })
                          }
                          className="w-full px-4 py-3 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">Aktivna akcija</span>
                        <span className="text-[10px] text-muted-foreground">
                          Prikazivati ovu akciju u katalogu
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, aktivna: !formData.aktivna })}
                        className={`transition-colors ${
                          formData.aktivna ? "text-emerald-500" : "text-muted-foreground"
                        }`}
                      >
                        {formData.aktivna ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 flex flex-col h-full">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Koraci (Slotovi)</h3>
                      <button
                        type="button"
                        onClick={addStep}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg text-xs font-bold transition-colors shadow-sm"
                      >
                        <Plus size={14} /> Dodaj Korak
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Definišite korake selekcije. Svaki korak ima naslov i filter (po kategorijama ili konkretnim proizvodima).
                    </p>
                    <ScrollArea className="flex-1 -mx-1 px-1">
                      <div className="space-y-4 py-2">
                        {formData.steps.map((step, idx) => (
                          <div key={idx} className="border rounded-xl p-4 bg-secondary/40 space-y-3 relative group">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold uppercase tracking-wider text-primary">Korak {idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeStep(idx)}
                                className="text-destructive text-xs hover:bg-destructive/10 px-2 py-1 rounded transition-colors"
                              >
                                Ukloni
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Naslov koraka</label>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => updateStep(idx, { title: e.target.value })}
                                  className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                  placeholder="npr. Izaberi bazu"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Filter tip</label>
                                  <select
                                    value={step.filter.type}
                                    onChange={(e) => updateStepFilterType(idx, e.target.value as 'category' | 'product')}
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm"
                                  >
                                    <option value="category">Kategorije</option>
                                    <option value="product">Proizvodi</option>
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Opis (opciono)</label>
                                  <input
                                    type="text"
                                    value={step.description || ""}
                                    onChange={(e) => updateStep(idx, { description: e.target.value })}
                                    className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    placeholder="Kratko uputstvo..."
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {step.filter.type === 'category' ? (
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground">Dozvoljene kategorije</label>
                                <div className="flex flex-wrap gap-1.5">
                                  {categories.map((cat) => (
                                    <label key={cat} className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer transition-colors ${step.filter.values.includes(cat) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted border-transparent hover:border-border'}`}>
                                      <input
                                        type="checkbox"
                                        checked={step.filter.values.includes(cat)}
                                        onChange={() => toggleStepFilterValue(idx, cat)}
                                        className="hidden"
                                      />
                                      {cat}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Izaberi proizvode</label>
                                  <span className="text-[10px] font-bold text-primary">{step.filter.values.length} izabrano</span>
                                </div>
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" size={12} />
                                  <input 
                                    type="text"
                                    placeholder="Pretraži..."
                                    className="w-full pl-7 pr-3 py-1.5 text-xs bg-input border border-border rounded-lg"
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                  />
                                </div>
                                <div className="max-h-40 overflow-y-auto border rounded-lg bg-secondary/20 p-1 space-y-1">
                                  {filteredProducts.map((product) => (
                                    <label 
                                      key={product.id} 
                                      className={`flex items-center gap-2 p-1.5 rounded hover:bg-muted cursor-pointer transition-colors ${step.filter.values.includes(product.id) ? 'bg-primary/10' : ''}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={step.filter.values.includes(product.id)}
                                        onChange={() => toggleStepFilterValue(idx, product.id)}
                                        className="rounded-sm border-primary text-primary focus:ring-primary w-3 h-3"
                                      />
                                      <img src={product.slike[0]} className="w-6 h-6 rounded object-cover" />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-medium truncate leading-tight">{product.naziv}</span>
                                        <span className="text-[8px] text-muted-foreground uppercase">{product.kategorija}</span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        
                        {formData.steps.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-border rounded-xl">
                            <p className="text-xs text-muted-foreground">Nema definisanih koraka.</p>
                            <button
                              type="button"
                              onClick={addStep}
                              className="mt-2 text-xs font-bold text-primary hover:underline"
                            >
                              Dodaj prvi korak
                            </button>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                </form>
              </div>

              <div className="p-6 border-t border-border bg-muted/30 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-muted transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  form="promo-form"
                  className="flex-1 py-3 gold-gradient rounded-lg font-bold text-primary-foreground shadow-gold flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Sačuvaj Akciju
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AlertDialog open={!!promoToDelete} onOpenChange={() => setPromoToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija će biti trajno obrisana. Proizvodi dodeljeni ovoj akciji će ostati u bazi,
              ali više neće biti deo ove paketne ponude.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Otkaži</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
