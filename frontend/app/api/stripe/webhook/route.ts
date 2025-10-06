import Stripe from "stripe";
import { NextResponse } from "next/server";
import type { OrderItem, ShippingAddress } from "@/types/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Helper: appel Strapi signé
async function strapiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${process.env.STRAPI_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.STRAPI_API_TOKEN}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return new NextResponse("Missing stripe-signature", { status: 400 });

  let event: Stripe.Event;
  try {
    const raw = await req.text(); // important: RAW body
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (e: any) {
    console.error("❌ Signature error:", e.message);
    return new NextResponse(`Webhook Error: ${e.message}`, { status: 400 });
  }

  try {
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    // Anti-doublon par sessionId
    const existing = await strapiFetch(
      `/api/orders?filters[stripeCheckoutSessionId][$eq]=${encodeURIComponent(session.id)}&fields[0]=id`
    );
    if (existing?.data?.length) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Récup des items payés AVEC access aux metadata qu’on a mises côté checkout
    const list = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });

    const itemsPayload: OrderItem[] = list.data.map((li) => {
      const price = li.price as Stripe.Price | null;
      const prod = (price?.product ?? null) as Stripe.Product | null;
      const md = prod?.metadata || {};

      const qty = li.quantity ?? 1;
      const unit = price?.unit_amount ?? 0; // centimes

      return {
        productId: Number(md.productId) || 0,
        productSlug: (md.productSlug as string) || "",
        title: li.description || prod?.name || "Produit",
        variantSku: (md.variantSku as string) || "",
        variantLabel: (md.variantLabel as string) || "",
        image: null,                // on laisse null (media id Strapi) si tu ne veux pas résoudre ici
        unitPrice: unit,            // centimes
        qty,
        total: unit * qty,          // centimes
      };
    });

    // Adresse (component)
    const s = (session as any).shipping_details;
    const addr = (s?.address || session.customer_details?.address) as Stripe.Address | undefined;
    const shippingAddress: ShippingAddress | undefined = addr
      ? {
          line1: addr.line1 || "",
          line2: addr.line2 || "",
          city: addr.city || "",
          zip: addr.postal_code || "",
          country: addr.country || "",
        }
      : undefined;

    // Payload Order (centimes)
    const payload = {
      data: {
        orderStatus: "paid",
        email: session.customer_details?.email ?? session.customer_email ?? "",
        items: itemsPayload,
        subtotal: session.amount_subtotal ?? 0,
        discount: session.total_details?.amount_discount ?? 0,
        shippingFee: session.total_details?.amount_shipping ?? 0,
        total: session.amount_total ?? 0,
        notes: "Paid via Stripe Checkout",
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? "",
        shippingAddress,
      },
    };

    await strapiFetch(`/api/orders`, { method: "POST", body: JSON.stringify(payload) });

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("❌ Handler error:", e);
    return new NextResponse("Webhook handler failed", { status: 500 });
  }
}
