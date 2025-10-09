'use strict';

/**
 * 🔄 Lifecycle Order
 * Calcule automatiquement les totaux (subtotal, discount, shippingFee, total)
 * et recalcule les totaux des items avant création / mise à jour.
 */

module.exports = {
  async beforeCreate(event) {
    const data = event.params.data;
    normalizeAndCompute(data);
  },
  async beforeUpdate(event) {
    const data = event.params.data;
    normalizeAndCompute(data);
  },
};

/**
 * Normalise et calcule les totaux d'une commande
 * @param {any} data - données de la commande
 */
function normalizeAndCompute(data) {
  try {
    if (!Array.isArray(data.items)) data.items = [];

    // Recalcule chaque item
    data.items = data.items.map((it) => {
      const unit = Number(it.unitPrice || 0);
      const qty = Math.max(1, Number(it.qty || 1));
      return { ...it, total: unit * qty };
    });

    // Totaux
    const subtotal = data.items.reduce((s, it) => s + Number(it.total || 0), 0);
    const discount = Number(data.discount || 0);
    const shipping = Number(data.shippingFee || 0);

    data.subtotal = subtotal;
    data.total = Math.max(0, subtotal - discount + shipping);
  } catch (err) {
    strapi.log.warn(`⚠️ Lifecycle Order - erreur calcul : ${err.message}`);
  }
}
