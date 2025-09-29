/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict';

import Stripe from 'stripe';

// ⚠️ Ne force pas apiVersion si ton SDK en impose une plus récente via les types.
// const stripe = new Stripe(process.env.STRIPE_SECRET as string, { apiVersion: '2025-08-27.basil' });
const stripe = new Stripe(process.env.STRIPE_SECRET as string);

/** Types locaux pour la complétion et lever les warnings */
type ProductVariant = {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  stock: number;
  color?: string;
  sku?: string;
  // Pour tolérer d'autres props éventuelles du component
  [key: string]: any;
};

type ProductWithVariants = {
  id: number;
  title?: string;
  variants?: ProductVariant[];
};

type OrderItem = {
  productId: number;
  productSlug: string;
  title: string;
  variantSku: string;
  variantLabel: string;
  unitPrice: number; // cents
  qty: number;
  total: number;     // cents
};

function mapLineItemsToOrderItems(lineItems: Stripe.ApiList<Stripe.LineItem>): OrderItem[] {
  if (!lineItems || !Array.isArray(lineItems.data) || lineItems.data.length === 0) return [];
  return lineItems.data.map((li) => {
    const qty = Number(li.quantity || 1);
    const subtotal = Number((li.amount_subtotal ?? li.amount_total ?? 0));
    const unit = qty > 0 ? Math.round(subtotal / qty) : 0;

    const meta = (li.price?.metadata ?? {}) as Record<string, string>;
    return {
      productId: Number(meta.productId || 0),
      productSlug: meta.productSlug || '',
      title: (li.description || meta.title || li.price?.nickname || 'Article') as string,
      variantSku: meta.variantSku || '',
      variantLabel: meta.variantLabel || '',
      unitPrice: unit,
      qty,
      total: unit * qty,
    };
  });
}

async function orderExistsForSession(sessionId: string): Promise<boolean> {
  const found = await strapi.entityService.findMany('api::order.order', {
    filters: { stripeCheckoutSessionId: sessionId },
    fields: ['id'],
    limit: 1,
  });
  return Array.isArray(found) && found.length > 0;
}

async function decrementVariantStock(productId: number, variantSku: string, qty: number) {
  if (!productId || !variantSku || !qty) return;

  try {
    const product = (await strapi.entityService.findOne('api::product.product', productId, {
      fields: ['id', 'title'],
      populate: { variants: true },
    })) as unknown as ProductWithVariants;

    if (!product || !Array.isArray(product.variants)) return;

    let changed = false;
    const newVariants: ProductVariant[] = product.variants.map((v) => {
      if (v?.sku === variantSku) {
        const newStock = Math.max(0, Number(v.stock ?? 0) - Number(qty));
        changed = true;
        return { ...v, stock: newStock };
      }
      return v;
    });

    if (changed) {
      // Cast soft car les types Strapi générés sont plus stricts que nos types locaux
      await strapi.entityService.update('api::product.product', productId, {
        data: { variants: newVariants as unknown as any[] },
      });
      strapi.log.info(`↘️ Stock décrémenté pour ${product.title ?? productId} (sku:${variantSku}) de ${qty}`);
    }
  } catch (e: any) {
    strapi.log.warn(`⚠️ Impossible de décrémenter le stock (p:${productId}/sku:${variantSku}) : ${e?.message ?? e}`);
  }
}

export default {
  async webhook(ctx: any) {
    const sig = ctx.request.headers['stripe-signature'];
    const raw = ctx.request.body[Symbol.for('unparsedBody')];

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err: any) {
      strapi.log.error('❌ Invalid Stripe signature:', err?.message ?? err);
      ctx.status = 400;
      ctx.body = { error: 'Invalid signature' };
      return;
    }

    if (event.type !== 'checkout.session.completed') {
      strapi.log.info(`ℹ️ Event Stripe ignoré : ${event.type}`);
      ctx.status = 200;
      ctx.body = { received: true };
      return;
    }

    try {
      const session = event.data.object as Stripe.Checkout.Session;
      const sessionId = session.id;
      const email = (session.customer_details?.email || session.customer_email || '') as string;

      strapi.log.info(`✅ checkout.session.completed reçu. session=${sessionId} email=${email || 'n/a'}`);

      // Idempotence
      if (await orderExistsForSession(sessionId)) {
        strapi.log.info(`ℹ️ Order déjà existant pour session ${sessionId} → ignoré`);
        ctx.status = 200;
        ctx.body = { received: true, duplicate: true };
        return;
      }

      // Line items
      let items: OrderItem[] = [];
      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100 });
        items = mapLineItemsToOrderItems(lineItems);
        strapi.log.info(`ℹ️ lineItems Stripe=${lineItems.data.length}, items=${items.length}`);
      } catch (e: any) {
        strapi.log.warn(`⚠️ Impossible de charger line items pour ${sessionId}: ${e?.message ?? e}`);
      }

      // Fallback si items requis dans Strapi
      if (!items || items.length === 0) {
        items = [{
          productId: 0,
          productSlug: 'placeholder',
          title: 'Article (test)',
          variantSku: '',
          variantLabel: '',
          unitPrice: 100,
          qty: 1,
          total: 100,
        }];
        strapi.log.info('ℹ️ Items vides → ajout d’un fallback.');
      }

      const shippingFee = Number(session.total_details?.amount_shipping || 0);
      const discount = Number(session.total_details?.amount_discount || 0);

      // Création Order (subtotal/total init à 0 → recalculés par ton lifecycle)
      const order = await strapi.entityService.create('api::order.order', {
        data: {
          orderStatus: 'paid',
          email,
          items,
          discount,
          shippingFee,
          stripeCheckoutSessionId: sessionId,
          stripePaymentIntentId: (session.payment_intent as string) || '',
          subtotal: 0,
          total: 0,
        },
      });

      strapi.log.info(`✅ Order #${order.id} créé (session=${sessionId})`);

      // Décrément du stock
      for (const it of items) {
        if (it.productId && it.variantSku) {
          await decrementVariantStock(it.productId, it.variantSku, it.qty);
        }
      }

      ctx.status = 200;
      ctx.body = { ok: true };
    } catch (e: any) {
      const details = JSON.stringify(e, Object.getOwnPropertyNames(e));
      strapi.log.error(`❌ Erreur webhook Stripe : ${details}`);
      ctx.status = 200; // éviter les retries infinis
      ctx.body = { ok: false, error: 'handled' };
    }
  },
};
