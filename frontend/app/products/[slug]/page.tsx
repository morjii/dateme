import { fetchAPI, formatPrice, mediaUrl } from "@/lib/api";
import type { Product, Variant } from "@/types/product";

function normalizeProduct(p: any): Product {
  const obj = p?.attributes ?? p ?? {};

  const imagesArray =
    Array.isArray(obj.images?.data)
      ? obj.images.data.map((i: any) => i?.attributes ?? i).filter(Boolean)
      : Array.isArray(obj.images)
      ? obj.images
      : [];

  const variantsArray: Variant[] =
    Array.isArray(obj.variants?.data)
      ? obj.variants.data.map((v: any) => v?.attributes ?? v).filter(Boolean)
      : Array.isArray(obj.variants)
      ? obj.variants
      : [];

  return {
    id: p?.id,
    title: obj.title ?? "Sans titre",
    slug: obj.slug ?? "",
    description: obj.description ?? "",
    price: obj.price ?? 0,
    image: imagesArray[0]?.url,
    alt: imagesArray[0]?.alternativeText ?? obj.title ?? "Image",
    variants: variantsArray,
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { data } = await fetchAPI(
    `/products?filters[slug][$eq]=${params.slug}&populate=*`
  );

  if (!Array.isArray(data) || data.length === 0) {
    return (
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Produit introuvable</h1>
        <p className="text-gray-600 mt-2">Vérifiez l’URL ou retournez à l’accueil.</p>
      </main>
    );
  }

  const product = normalizeProduct(data[0]);
  const src = mediaUrl(product.image);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="aspect-square bg-gray-100">
            {src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={product.alt}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-gray-400">
                aucune image
              </div>
            )}
          </div>
        </div>

        {/* Infos */}
        <div>
          <h1 className="text-3xl font-bold">{product.title}</h1>
          <p className="text-lg text-gray-700 mt-2">{formatPrice(product.price)}</p>

          {product.description && (
            <p className="text-gray-600 mt-4 whitespace-pre-wrap">
              {product.description}
            </p>
          )}

          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Variantes</h3>
            {product.variants.length === 0 ? (
              <p className="text-sm text-gray-500">Aucune variante définie.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {product.variants.map((v) => (
                  <li key={v.id ?? v.sku} className="flex items-center gap-2">
                    <span className="inline-flex rounded bg-gray-100 px-2 py-0.5">
                      {v.size || "—"}
                    </span>
                    <span className="text-gray-600">Couleur: {v.color || "—"}</span>
                    <span className="text-gray-600">SKU: {v.sku || "—"}</span>
                    <span
                      className={`ml-auto ${
                        !v.stock ? "text-red-600" : "text-gray-700"
                      }`}
                    >
                      Stock: {typeof v.stock === "number" ? v.stock : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6">
            <button
              className="w-full md:w-auto rounded-lg bg-black text-white px-4 py-2 disabled:opacity-50"
              disabled={product.variants.every((v) => (v.stock ?? 0) <= 0)}
            >
              Ajouter au panier (bientôt)
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
