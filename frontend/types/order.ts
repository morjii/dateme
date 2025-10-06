export interface OrderItem {
    productId: number;
    productSlug: string;
    title: string;
    variantSku?: string;
    variantLabel?: string;
    image?: number | null;   // id Media dans Strapi
    unitPrice: number;       // centimes
    qty: number;
    total: number;           // centimes
  }
  
  export interface ShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    zip: string;
    country: string;
  }
  
  export interface Order {
    id?: number;
    orderStatus: "pending" | "paid" | "cancelled";
    email: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    notes?: string;
    stripeCheckoutSessionId?: string;
    stripePaymentIntentId?: string;
    shippingAddress?: ShippingAddress;
  }
  