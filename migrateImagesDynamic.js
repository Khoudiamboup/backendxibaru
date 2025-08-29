import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import dayjs from 'dayjs';

dotenv.config();

// Config Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Config MySQL
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Fonction de migration
const uploadFolder = async (dir, connection) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      await uploadFolder(fullPath, connection); // récursif
    } else {
      try {
        // Créer dossier dynamique basé sur la date de création du fichier
        const fileDate = dayjs(stat.birthtime);
        const year = fileDate.format('YYYY');
        const month = fileDate.format('MM');
        const folder = `uploads/${year}/${month}`;

        // Public ID basé sur le nom du fichier
        const publicId = path.basename(fullPath, path.extname(fullPath));

        // Upload sur Cloudinary
        const result = await cloudinary.uploader.upload(fullPath, {
          folder: folder,
          public_id: publicId,
        });

        console.log(`✅ Upload réussi : ${result.secure_url}`);

        // Mettre à jour la BDD (exemple wp_posts)
        const fileName = path.basename(fullPath);
        await connection.execute(
          'UPDATE wp_posts SET guid = ? WHERE guid LIKE ?',
          [result.secure_url, `%${fileName}%`]
        );
        console.log(`🔄 BDD mise à jour pour : ${fileName}`);
      } catch (error) {
        console.error(`❌ Erreur upload ${file}:`, error);
      }
    }
  }
};

const main = async () => {
  const connection = await mysql.createConnection(dbConfig);
  await uploadFolder('./uploads', connection);
  await connection.end();
  console.log('🎉 Migration terminée ! Toutes les images sont sur Cloudinary.');
};

main();
