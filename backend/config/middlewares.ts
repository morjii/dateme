// backend/config/middlewares.js
module.exports = ({ env }) => {
  // Origines CORS : liste séparée par des virgules
  const origins = (env('CORS_ORIGINS', 'http://localhost:3000')).split(',').map(s => s.trim());

  return [
    'strapi::errors',

    // Sécurité + CSP (assouplie pour images/medias)
    {
      name: 'strapi::security',
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            // autoriser images/medias en http(s), data, blob (local + Cloudinary/S3)
            'img-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
            'media-src': ["'self'", 'data:', 'blob:', 'https:', 'http:'],
            // si tu sers des fonts externes, ajoute font-src ici
            // 'font-src': ["'self'", 'https:', 'data:'],
            // évite que Strapi force l'upgrade HTTP→HTTPS en local
            upgradeInsecureRequests: null,
          },
        },
      },
    },

    // CORS
    {
      name: 'strapi::cors',
      config: {
        enabled: true,
        origin: origins, // ex: ["http://localhost:3000", "https://mydomain.com"]
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        headers: [
          'Content-Type',
          'Authorization',
          'Origin',
          'Accept',
          'User-Agent',
          'Keep-Alive',
          'DNT',
          'If-Modified-Since',
          'Cache-Control',
          'X-Requested-With',
          'Range',
          'stripe-signature', // ← nécessaire pour le webhook Stripe
        ],
        keepHeaderOnError: true,
        credentials: true,
      },
    },

    'strapi::poweredBy',
    'strapi::logger',
    'strapi::query',

    // Body parser (avec raw body pour Stripe)
    {
      name: 'strapi::body',
      config: {
        jsonLimit: '10mb',
        formLimit: '10mb',
        textLimit: '10mb',
        includeUnparsed: true, // ← indispensable pour vérifier la signature Stripe
      },
    },

    'strapi::session',
    'strapi::favicon',
    'strapi::public',
  ];
};
