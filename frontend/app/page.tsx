import Link from "next/link";
import { fetchAPI, formatPrice, mediaUrl } from "@/lib/api";

// normalise le produit quelle que soit la forme renvoyée par Strapi
function normalizeProduct(p: any) {
  const obj = p?.attributes ?? p ?? {};
  // images: soit [{...}], soit {data:[{attributes:{url}}]}
  const imagesArray =
    Array.isArray(obj.images?.data)
      ? obj.images.data.map((i: any) => i?.attributes ?? i).filter(Boolean)
      : Array.isArray(obj.images)
        ? obj.images
        : [];

  return {
    id: p?.id,
    title: obj.title ?? "Sans titre",
    slug: obj.slug ?? "",
    price: obj.price,
    image: imagesArray[0]?.url,
    alt: imagesArray[0]?.alternativeText ?? obj.title ?? "Image",
  };
}

export default async function Home() {
  // populate tout pour être tranquille pendant l’intégration
  const { data } = await fetchAPI("/products?populate=*");

  const items = Array.isArray(data) ? data.map(normalizeProduct) : [];

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Boutique</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((p) => {
          const src = mediaUrl(p.image);

          return (
            <Link
              href={p.slug ? `/products/${p.slug}` : "#"}
              key={p.id}
              className="group rounded-xl border bg-white overflow-hidden hover:shadow-md transition"
            >
              <div className="aspect-[4/3] bg-gray-100">
                {src ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={src} alt={p.alt} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-gray-400">
                    aucune image
                  </div>
                )}
              </div>

              <div className="p-4">
                <h2 className="font-semibold line-clamp-1">{p.title}</h2>
                <p className="text-sm text-gray-600 mt-1">{formatPrice(p.price)}</p>
                <p className="text-xs text-blue-600 mt-2 group-hover:underline">Voir le produit →</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
