export type CartItem = {
    productId: number;
    productSlug: string;
    title: string;
    variantSku: string;
    variantLabel?: string;
    unitPrice: number; // en centimes
    qty: number;
  };
  