'use client';
import { useMemo, useState } from 'react';
import { useCart } from '@/lib/cart-store';
import type { Variant, Product } from '@/types/product';
import { formatPrice } from '@/lib/api';

type Props = {
  product: Product;              // ton modèle normalisé
};

export default function AddToCart({ product }: Props) {
  const addItem = useCart((s) => s.addItem);

  // Construire les options à partir des variants
  const sizes = useMemo(() => Array.from(new Set(product.variants.map(v => v.size).filter(Boolean))), [product]);
  const colors = useMemo(() => Array.from(new Set(product.variants.map(v => v.color).filter(Boolean))), [product]);

  // Sélection par défaut = première variante existante, sinon vide
  const first = product.variants[0];
  const [size, setSize] = useState<string | undefined>(first?.size);
  const [color, setColor] = useState<string | undefined>(first?.color);
  const [qty, setQty] = useState<number>(1);

  const selectedVariant: Variant | undefined = useMemo(() => {
    if (!product.variants.length) return undefined;
    // si pas d’options, prends la première
    if (!sizes.length && !colors.length) return first;
    return product.variants.find(v =>
      (sizes.length ? v.size === size : true) &&
      (colors.length ? v.color === color : true)
    ) || first;
  }, [product.variants, first, size, color, sizes.length, colors.length]);

  const outOfStock = (selectedVariant?.stock ?? 0) <= 0;

  function onAdd() {
    if (!selectedVariant) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      title: product.title,
      variantSku: selectedVariant.sku || '',
      variantLabel: [selectedVariant.color, selectedVariant.size].filter(Boolean).join(' / '),
      unitPrice: product.price ?? 0, // si les prix varient par variant, adapte ici
      qty,
    });
  }

  return (
    <div className="space-y-3">
      {/* Sélecteurs */}
      {colors.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Couleur</label>
          <select
            className="border rounded px-2 py-1"
            value={color ?? ''}
            onChange={(e) => setColor(e.target.value || undefined)}
          >
            {colors.map((c) => (
              <option key={c as string} value={c as string}>{c as string}</option>
            ))}
          </select>
        </div>
      )}

      {sizes.length > 0 && (
        <div className="flex items-center gap-2">
          <label className="text-sm w-24">Taille</label>
          <select
            className="border rounded px-2 py-1"
            value={size ?? ''}
            onChange={(e) => setSize(e.target.value || undefined)}
          >
            {sizes.map((s) => (
              <option key={s as string} value={s as string}>{s as string}</option>
            ))}
          </select>
        </div>
      )}

      {/* Quantité */}
      <div className="flex items-center gap-2">
        <label className="text-sm w-24">Quantité</label>
        <input
          type="number"
          min={1}
          className="w-24 border rounded px-2 py-1"
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value || 1)))}
        />
      </div>

      {/* Stock */}
      <p className={`text-sm ${outOfStock ? 'text-red-600' : 'text-gray-600'}`}>
        Stock: {typeof selectedVariant?.stock === 'number' ? selectedVariant.stock : '—'}
      </p>

      {/* CTA */}
      <button
        onClick={onAdd}
        disabled={outOfStock}
        className="w-full md:w-auto rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
      >
        Ajouter au panier — {formatPrice(product.price)}
      </button>
    </div>
  );
}
