'use client';
import { useCart } from '@/lib/cart-store';
import { formatPrice } from '@/lib/api';

export default function CartPage() {
  const items = useCart((s) => s.items);
  const removeItem = useCart((s) => s.removeItem);
  const updateQty = useCart((s) => s.updateQty);
  const subtotal = useCart((s) => s.subtotal)();

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Panier</h1>

      {items.length === 0 ? (
        <p className="text-gray-600">Votre panier est vide.</p>
      ) : (
        <div className="space-y-4">
          {items.map((it) => (
            <div key={`${it.productId}-${it.variantSku}`} className="flex items-center gap-4 border p-3 rounded">
              <div className="flex-1">
                <div className="font-semibold">{it.title}</div>
                <div className="text-sm text-gray-600">{it.variantLabel || it.variantSku}</div>
                <div className="text-sm">{formatPrice(it.unitPrice)}</div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateQty(it.productId, it.variantSku, it.qty - 1)}
                >−</button>
                <input
                  type="number"
                  min={1}
                  className="w-16 border rounded px-2 py-1 text-center"
                  value={it.qty}
                  onChange={(e) => updateQty(it.productId, it.variantSku, Math.max(1, Number(e.target.value || 1)))}
                />
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => updateQty(it.productId, it.variantSku, it.qty + 1)}
                >+</button>
              </div>

              <div className="w-24 text-right font-semibold">{formatPrice(it.unitPrice * it.qty)}</div>

              <button
                className="text-red-600 text-sm ml-2"
                onClick={() => removeItem(it.productId, it.variantSku)}
              >
                Supprimer
              </button>
            </div>
          ))}

          <div className="flex justify-end text-lg font-bold">
            Sous-total : {formatPrice(subtotal)}
          </div>

          <div className="flex justify-end">
            <a
              href="/checkout" // (bientôt) ou bouton qui déclenchera la route /api/checkout
              className="rounded-lg bg-black text-white px-4 py-2"
            >
              Commander
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
