import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { ArticleService } from '../article/article.service';

function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<\/?[^>]+(>|$)/g, "").replace(/\s+/g, ' ').trim();
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
}

@Controller('share')
export class ShareController {
  constructor(private readonly articleService: ArticleService) {}

  @Get(':slug')
  async sharePage(@Param('slug') slug: string, @Res() res: Response) {
    const article = await this.articleService.findBySlug(slug);

    if (!article) {
      return res.status(404).send('Article non trouvé');
    }

    const excerpt = article.postExcerpt && article.postExcerpt.trim() !== ''
      ? article.postExcerpt
      : stripHtml(article.postContent).substring(0, 200) + '...';

    const html = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(article.postTitle)}</title>
        <meta property="og:title" content="${escapeHtml(article.postTitle)}" />
        <meta property="og:description" content="${escapeHtml(excerpt)}" />
        <meta property="og:image" content="${article.image || ''}" />
        <meta property="og:url" content="https://xibarubambouck.com/articles/${article.postName}" />
        <meta property="og:type" content="article" />
        <script>
          setTimeout(() => {
            window.location.href = "https://xibarubambouck.com/articles/${article.postName}";
          }, 300);
        </script>
      </head>
      <body>
        <p>Redirection en cours...</p>
      </body>
      </html>
    `;

    return res.send(html);
  }
}
