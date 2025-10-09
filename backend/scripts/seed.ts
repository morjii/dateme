// backend/scripts/seed.ts
// Exécution : npx ts-node scripts/seed.ts (assure-toi que Strapi est démarré en bootstrap mode si besoin)

export default async () => {
    // 1) Récupère un ou plusieurs fichiers déjà uploadés (plugin Upload)
    const files = await strapi.entityService.findMany('plugin::upload.file', {
      fields: ['id'],
      limit: 3,
    });
  
    // On prépare la valeur pour 'images' :
    // - si tu as des fichiers : on relie leurs IDs
    // - sinon : on essaie [] (si le schéma autorise vide) ; si le champ est strictement requis non vide, il faudra en uploader un d’abord
    const imageIds = files.map((f: any) => f.id);
    const imagesValue = imageIds.length ? imageIds : [];
  
    try {
      const product = await strapi.entityService.create('api::product.product', {
        // ⚠️ on caste en any pour contourner la rigidité des types générés (qui marquent images comme requis)
        data: {
          title: 'T-shirt Boilerplate',
          slug: 'tshirt-boilerplate',
          price: 1999,
          isActive: true,
          variants: [
            { size: 'S', color: 'white', sku: 'TS-WHITE-S', stock: 10 },
            { size: 'M', color: 'black', sku: 'TS-BLACK-M', stock: 8 },
          ],
          publishedAt: new Date(),
          images: imagesValue as any, // ← relation media (IDs)
        } as any,
      });
  
      strapi.log.info(`✅ Seed OK : produit #${product.id} (images liées: ${imageIds.length})`);
      if (!imageIds.length) {
        strapi.log.warn('⚠️ Aucune image uploadée trouvée — le produit a été créé avec images: []. Si ton schéma exige au moins 1 image, upload d’abord un fichier via l’admin et relance le seed.');
      }
    } catch (e: any) {
      strapi.log.error(`❌ Seed échec : ${e?.message || e}`);
    }
  };
  