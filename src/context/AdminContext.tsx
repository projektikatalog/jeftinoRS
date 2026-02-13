import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Product, Order, Promotion } from "@/types";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";

interface AdminContextType {
  user: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  products: Product[];
  refreshProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, "id" | "created_at">) => Promise<{ error: any }>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<{ error: any }>;
  deleteProduct: (id: string) => Promise<{ error: any }>;
  uploadImage: (file: File) => Promise<string | null>;
  orders: Order[];
  refreshOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, "id" | "created_at">) => Promise<{ data?: any; error: any }>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<{ error: any }>;
  promotions: Promotion[];
  refreshPromotions: () => Promise<void>;
  addPromotion: (promo: Omit<Promotion, "id" | "created_at">) => Promise<{ data?: any; error: any }>;
  updatePromotion: (id: string, updates: Partial<Promotion>) => Promise<{ error: any }>;
  deletePromotion: (id: string) => Promise<{ error: any }>;
  getSetting: (key: string) => Promise<string | null>;
  updateSetting: (key: string, value: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Initialize Auth and Fetch Data
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session);
      if (session) {
        fetchOrders();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session);
      if (session) {
        fetchOrders();
      } else {
        setOrders([]);
      }
    });

    // Initial fetch of products and promotions (public)
    fetchProducts();
    fetchPromotions();
    setLoading(false);

    return () => subscription.unsubscribe();
  }, []);

  const fetchPromotions = async () => {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromotions(data || []);
    } catch (error: any) {
      console.error('Error fetching promotions:', error);
    }
  };

  const addPromotion = async (promo: Omit<Promotion, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase.from('promotions').insert([promo]).select();
      if (error) throw error;
      
      await fetchPromotions();
      return { data, error: null };
    } catch (error: any) {
      console.error('Error adding promotion:', error);
      toast({
        title: "Greška",
        description: "Neuspešno dodavanje akcije.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const updatePromotion = async (id: string, updates: Partial<Promotion>) => {
    try {
      const { error } = await supabase
        .from('promotions')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;

      await fetchPromotions();
      return { error: null };
    } catch (error: any) {
      console.error('Error updating promotion:', error);
      toast({
        title: "Greška",
        description: "Neuspešno ažuriranje akcije.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deletePromotion = async (id: string) => {
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', id);
      if (error) throw error;

      await fetchPromotions();
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting promotion:', error);
      toast({
        title: "Greška",
        description: "Neuspešno brisanje akcije.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('proizvodi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast({
        title: "Greška",
        description: "Neuspešno učitavanje proizvoda.",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('porudzbine')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Greška",
        description: "Neuspešno učitavanje porudžbina.",
        variant: "destructive",
      });
    }
  };

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addProduct = async (product: Omit<Product, "id" | "created_at">) => {
    try {
      const { error } = await supabase.from('proizvodi').insert([product]);
      if (error) throw error;
      
      await fetchProducts();
      return { error: null };
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Greška",
        description: "Neuspešno dodavanje proizvoda.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('proizvodi')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;

      await fetchProducts();
      return { error: null };
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: "Greška",
        description: "Neuspešno ažuriranje proizvoda.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      const { data: product, error: fetchError } = await supabase
        .from('proizvodi')
        .select('slike, varijante')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      const extractPath = (url: string) => {
        const marker = '/object/public/product-images/';
        const idx = url.indexOf(marker);
        if (idx === -1) return null;
        return url.substring(idx + marker.length);
      };

      const imageUrls: string[] = Array.isArray(product?.slike) ? product.slike : [];
      const variantImageUrls: string[] = Array.isArray(product?.varijante)
        ? (product.varijante as unknown[])
            .map(v => {
              const o = v as { image_url?: string; slika_url?: string; image?: string };
              return o.image_url || o.slika_url || o.image;
            })
            .filter((u): u is string => typeof u === 'string')
        : [];
      const allUrls = [...imageUrls, ...variantImageUrls];
      const filePaths = allUrls
        .map(u => extractPath(u))
        .filter((p): p is string => !!p);

      const { error } = await supabase.from('proizvodi').delete().eq('id', id);
      if (error) throw error;

      await fetchProducts();

      if (filePaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from('product-images')
          .remove(filePaths);
        if (removeError) {
          console.warn('Image removal warning:', removeError);
        }
      }
      return { error: null };
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast({
        title: "Greška",
        description: "Neuspešno brisanje proizvoda.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const uploadImage = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Greška",
        description: "Neuspešno otpremanje slike.",
        variant: "destructive",
      });
      return null;
    }
  };

  const addOrder = async (order: Omit<Order, "id" | "created_at">) => {
    try {
      // Use the new v3 function to avoid overloading conflicts
      const { data, error } = await supabase.rpc('create_order_v3', {
        p_ime_kupca: order.ime_kupca,
        p_email_kupca: order.email_kupca || "N/A",
        p_adresa_kupca: order.adresa_kupca,
        p_grad_kupca: order.grad_kupca,
        p_postanski_broj_kupca: order.postanski_broj_kupca || "",
        p_telefon_kupca: order.telefon_kupca,
        p_artikli: order.artikli,
        p_ukupna_cena: Number(order.ukupna_cena),
        p_shipping_cost: Number(order.shipping_cost),
        p_promo_title: order.promo_title || null,
        p_promo_price: order.promo_price ? Number(order.promo_price) : null,
        p_promotion_id: order.promotion_id || null
      });

      if (error) {
        console.error("RPC create_order_v3 failed:", error);
        // Fallback to direct insert if RPC fails
        const { data: insertData, error: insertError } = await supabase.from('porudzbine').insert([{
          ...order,
          ukupna_cena: Number(order.ukupna_cena),
          shipping_cost: Number(order.shipping_cost)
        }]).select();
        
        if (insertError) throw insertError;
        return { data: insertData, error: null };
      }
      
      return { data: data ? [data] : null, error: null };
    } catch (error: any) {
       console.error("Error creating order:", error);
       toast({
         title: "Greška",
         description: "Neuspešno kreiranje porudžbine. Molimo pokušajte ponovo.",
         variant: "destructive",
       });
       return { data: null, error };
    }
  };

  const updateOrderStatus = async (id: string, status: Order["status"]) => {
    try {
      const { error } = await supabase
        .from('porudzbine')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;

      await fetchOrders();
      return { error: null };
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast({
        title: "Greška",
        description: "Neuspešna promena statusa porudžbine.",
        variant: "destructive",
      });
      return { error };
    }
  };

  const getSetting = async (key: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      return data?.value || null;
    } catch (error: any) {
      console.error('Error fetching setting:', error);
      // Optional: Don't show toast for getSetting as it might be internal/frequent
      return null;
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({ key, value });
      
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error updating setting:', error);
      toast({
        title: "Greška",
        description: "Neuspešno ažuriranje podešavanja.",
        variant: "destructive",
      });
      return { error };
    }
  };

  return (
    <AdminContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        products,
        refreshProducts: fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        uploadImage,
        orders,
        refreshOrders: fetchOrders,
        addOrder,
        updateOrderStatus,
        promotions,
        refreshPromotions: fetchPromotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        getSetting,
        updateSetting,
        loading,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
