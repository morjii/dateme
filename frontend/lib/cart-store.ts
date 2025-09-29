'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types/cart';

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: number, variantSku: string) => void;
  updateQty: (productId: number, variantSku: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const idx = state.items.findIndex(
            (i) => i.productId === item.productId && i.variantSku === item.variantSku
          );
          if (idx >= 0) {
            const copy = [...state.items];
            copy[idx] = { ...copy[idx], qty: copy[idx].qty + item.qty };
            return { items: copy };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantSku) =>
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.variantSku === variantSku)
          ),
        })),

      updateQty: (productId, variantSku, qty) =>
        set((state) => {
          const copy = state.items.map((i) => {
            if (i.productId === productId && i.variantSku === variantSku) {
              return { ...i, qty: Math.max(1, qty) };
            }
            return i;
          });
          return { items: copy };
        }),

      clear: () => set({ items: [] }),

      subtotal: () => get().items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0),
    }),
    { name: 'cart-v1' }
  )
);
