// migrate-images.js
// Script pour mettre à jour les URLs d'images des articles dans la DB

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Charger les variables d'environnement depuis le fichier .env
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function migrateImages() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Récupérer tous les articles
    const [articles] = await connection.execute('SELECT id, image FROM articles');

    for (const article of articles) {
      const { id, image } = article;

      // Vérifier si l'image utilise encore l'ancien chemin
      if (image && image.includes('xibarubamback.onrender.com/uploads')) {
        // Construire la nouvelle URL Cloudinary
        const newImage = image.replace(
          'https://xibarubamback.onrender.com/uploads',
          'https://res.cloudinary.com/daepsasbx/image/upload'
        );

        // Mettre à jour l'article
        await connection.execute('UPDATE articles SET image = ? WHERE id = ?', [newImage, id]);
        console.log(`✅ Article ${id} mis à jour`);
      }
    }

    console.log('✅ Migration terminée');
  } catch (err) {
    console.error('❌ Erreur lors de la migration :', err);
  } finally {
    await connection.end();
  }
}

migrateImages();
