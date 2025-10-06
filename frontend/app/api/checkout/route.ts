import Stripe from "stripe";
import { NextResponse } from "next/server";
import type { CartItem } from "@/types/cart";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper pour requêter Strapi
async function fetchStrapi(path: string) {
  const res = await fetch(`${process.env.STRAPI_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
    },
  });
  if (!res.ok) throw new Error(`Strapi error: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function POST(req: Request) {
  try {
    const { items } = (await req.json()) as { items: CartItem[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new NextResponse("No items provided", { status: 400 });
    }

    // ✅ Étape 1 : Revalider les prix depuis Strapi
    const ids = items.map((i) => i.productId).join(",");
    const db = await fetchStrapi(
      `/api/products?filters[id][$in]=${ids}&fields[0]=price&fields[1]=title&fields[2]=slug&pagination[pageSize]=100`
    );

    const priceMap = new Map<number, { price: number; title: string; slug: string }>();
    for (const p of db.data) {
      priceMap.set(p.id, {
        price: p.attributes.price,
        title: p.attributes.title,
        slug: p.attributes.slug,
      });
    }

    // ✅ Étape 2 : Construire les line_items Stripe fiables
    const line_items = items.map((it) => {
      const p = priceMap.get(it.productId);
      if (!p) throw new Error(`Product ${it.productId} not found in Strapi`);

      return {
        quantity: it.qty,
        price_data: {
          currency: "eur",
          unit_amount: p.price, // centimes
          product_data: {
            name: p.title,
            metadata: {
              productId: String(it.productId),
              productSlug: p.slug || "",
              variantSku: it.variantSku || "",
              variantLabel: it.variantLabel || "",
            },
          },
        },
      };
    });

    // ✅ Étape 3 : Créer la session Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      shipping_address_collection: { allowed_countries: ["FR"] },
      allow_promotion_codes: false,
      shipping_options: [
        {
          shipping_rate_data: {
            display_name: "Standard",
            type: "fixed_amount",
            fixed_amount: { amount: 590, currency: "eur" },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/cancel`,
      line_items,
    });

    return NextResponse.json({ id: session.id, url: session.url });
  } catch (err: any) {
    console.error("❌ Checkout error:", err);
    return new NextResponse(`Checkout failed: ${err.message}`, { status: 500 });
  }
}
