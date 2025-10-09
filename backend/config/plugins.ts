// backend/config/plugins.js
module.exports = ({ env }) => ({
    upload: {
      config: env('CLOUDINARY_CLOUD_NAME') ? {
        provider: '@strapi/provider-upload-cloudinary',
        providerOptions: {
          cloud_name: env('CLOUDINARY_CLOUD_NAME'),
          api_key: env('CLOUDINARY_API_KEY'),
          api_secret: env('CLOUDINARY_API_SECRET'),
        },
        actionOptions: {
          upload: {},
          delete: {},
        },
      } : {}, // sinon Strapi utilisera le stockage local
    },
  
    // (exemple pour plus tard : email provider)
    // email: {
    //   config: {
    //     provider: env('EMAIL_PROVIDER', 'smtp'),
    //     providerOptions: {
    //       host: env('SMTP_HOST'),
    //       port: env('SMTP_PORT'),
    //       auth: {
    //         user: env('SMTP_USERNAME'),
    //         pass: env('SMTP_PASSWORD'),
    //       },
    //     },
    //     settings: {
    //       defaultFrom: env('DEFAULT_FROM'),
    //       defaultReplyTo: env('DEFAULT_REPLY_TO'),
    //     },
    //   },
    // },
  });
  