// front/types/product.ts

export type Variant = {
    id?: number;
    size?: "XS" | "S" | "M" | "L" | "XL" | "XXL";
    color?: string;
    sku?: string;
    stock?: number;
  };
  
  export type Product = {
    id: number;
    title: string;
    slug: string;
    description?: string;
    price: number;
    image?: string;
    alt?: string;
    variants: Variant[];
  };
  