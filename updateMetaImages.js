import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function updateMetaImages() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    // Récupérer toutes les thumbnails avec leur cloud_url
    const [thumbnails] = await connection.execute(`
      SELECT thumb_meta.post_id AS article_id, cloud_meta.meta_value AS cloud_url, file_meta.meta_value AS file_path
      FROM wp_postmeta AS thumb_meta
      LEFT JOIN wp_postmeta AS file_meta
        ON file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = '_wp_attached_file'
      LEFT JOIN wp_postmeta AS cloud_meta
        ON cloud_meta.post_id = thumb_meta.meta_value AND cloud_meta.meta_key = 'cloud_url'
      WHERE thumb_meta.meta_key = '_thumbnail_id'
    `);

    for (const thumb of thumbnails) {
      const { article_id, cloud_url, file_path } = thumb;

      if (cloud_url) {
        // Mettre à jour _wp_attached_file pour qu'il pointe vers Cloudinary
        await connection.execute(
          `UPDATE wp_postmeta 
           SET meta_value = ? 
           WHERE post_id = ? AND meta_key = '_wp_attached_file'`,
          [cloud_url, thumb.article_id]
        );
        console.log(`✅ Article ${article_id} mis à jour avec Cloudinary`);
      } else if (file_path) {
        console.log(`⚠️ Article ${article_id} n'a pas de cloud_url, garde l'ancien chemin: ${file_path}`);
      }
    }

    console.log('🎉 Mise à jour des meta_values terminée !');
  } catch (err) {
    console.error('❌ Erreur:', err);
  } finally {
    await connection.end();
  }
}

updateMetaImages();     