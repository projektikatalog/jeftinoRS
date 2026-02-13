export interface Variant {
  name: string;
  price: number;
  old_price?: number;
}

export interface Product {
  id: string;
  created_at?: string;
  naziv: string;
  cena: number;
  opis: string;
  slike: string[];
  velicine: string[]; // Deprecated, but kept for compatibility
  varijante?: Variant[];
  kategorija: string;
  dostupno: boolean;
  is_new?: boolean;
  is_on_sale?: boolean;
  stara_cena?: number;
  is_promo?: boolean;
  promotion_id?: string;
  only_bundle?: boolean;
}

export interface Promotion {
  id: string;
  naslov: string;
  potrebna_kolicina: number; // Keep for compatibility if needed, but we'll use required_items
  required_items: number;
  ukupna_cena: number;
  aktivna: boolean;
  promo_image_url?: string;
  created_at?: string;
  steps?: BundleStep[]; // Optional slot-based step configuration
}

export interface PromoSettings {
  isActionActive: boolean;
  actionTitle: string;
  requiredQuantity: number;
  totalPrice: number;
}

export interface CartItem {
  product: Product;
  variant?: Variant; // Selected variant
  size?: string; // Legacy support
  quantity: number;
  bundle_id?: string | null;
  isPromo?: boolean;
  stepIndex?: number;
}

export interface BundleStepFilter {
  type: 'category' | 'product';
  values: string[];
}

export interface BundleStep {
  title: string;
  description?: string;
  filter: BundleStepFilter;
}

export interface Order {
  id: string;
  order_code?: string;
  created_at: string;
  ime_kupca: string;
  email_kupca: string;
  adresa_kupca: string;
  grad_kupca: string;
  postanski_broj_kupca: string;
  telefon_kupca: string;
  artikli: CartItem[];
  ukupna_cena: number;
  shipping_cost: number;
  status: 'Primljeno' | 'U obradi' | 'Poslato' | 'Isporučeno' | 'novo' | 'otkazano' | string;
  promo_title?: string | null;
  promo_price?: number | null;
  promotion_id?: string | null;
}

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email?: string;
}
