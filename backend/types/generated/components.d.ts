import type { Schema, Struct } from '@strapi/strapi';

export interface OrderOrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_order_order_items';
  info: {
    displayName: 'order.order-item';
  };
  attributes: {
    image: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios'>;
    productId: Schema.Attribute.Integer & Schema.Attribute.Required;
    productSlug: Schema.Attribute.String & Schema.Attribute.Required;
    qty: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
    total: Schema.Attribute.Integer & Schema.Attribute.Required;
    unitPrice: Schema.Attribute.Integer & Schema.Attribute.Required;
    variantLabel: Schema.Attribute.String;
    variantSku: Schema.Attribute.String;
  };
}

export interface ProductProductVariant extends Struct.ComponentSchema {
  collectionName: 'components_product_product_variants';
  info: {
    displayName: 'product.variant';
  };
  attributes: {
    color: Schema.Attribute.String;
    size: Schema.Attribute.Enumeration<['XS', 'S', 'M', 'L', 'XL', 'XXL']> &
      Schema.Attribute.Required;
    sku: Schema.Attribute.String & Schema.Attribute.Unique;
    stock: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      > &
      Schema.Attribute.DefaultTo<0>;
  };
}

export interface SharedSharedAddress extends Struct.ComponentSchema {
  collectionName: 'components_shared_shared_addresses';
  info: {
    displayName: 'shared.address';
  };
  attributes: {
    city: Schema.Attribute.String & Schema.Attribute.Required;
    country: Schema.Attribute.String & Schema.Attribute.Required;
    line1: Schema.Attribute.String & Schema.Attribute.Required;
    line2: Schema.Attribute.String;
    zip: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order.order-order-item': OrderOrderOrderItem;
      'product.product-variant': ProductProductVariant;
      'shared.shared-address': SharedSharedAddress;
    }
  }
}
