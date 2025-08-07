// src/debug.controller.ts - Juste pour le debug, pas pour servir les fichiers
import { Controller, Get } from '@nestjs/common';
import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';

@Controller('debug')
export class DebugController {
  
  @Get('uploads')
  checkUploads() {
    const uploadsPath = join(process.cwd(), 'uploads');
    
    if (!existsSync(uploadsPath)) {
      return {
        error: 'Le dossier uploads n\'existe pas',
        expectedPath: uploadsPath,
      };
    }

    try {
      const files = this.listFiles(uploadsPath);
      
      return {
        success: true,
        uploadsPath,
        totalFiles: files.length,
        sampleImages: files
          .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
          .slice(0, 10)
          .map(file => ({
            filename: file,
            url: `http://localhost:3001/uploads/${file}`
          }))
      };
    } catch (error) {
      return {
        error: 'Erreur lors de la lecture du dossier uploads',
        details: error.message,
      };
    }
  }

  private listFiles(dir: string, baseDir = ''): string[] {
    const files: string[] = [];
    const items = readdirSync(dir);
    
    for (const item of items) {
      const fullPath = join(dir, item);
      const relativePath = join(baseDir, item);
      
      if (statSync(fullPath).isDirectory()) {
        files.push(...this.listFiles(fullPath, relativePath));
      } else {
        files.push(relativePath.replace(/\\/g, '/'));
      }
    }
    return files;
  }
}

// N'oubliez pas de l'ajouter dans app.module.ts :
// controllers: [AppController, DebugController]