import { Injectable } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const sharp = require('sharp');

const PREVIEW_WIDTH = 1200;

@Injectable()
export class ImageProcessingService {
  async metadata(input: Buffer): Promise<{ width?: number; height?: number }> {
    const m = await sharp(input).metadata();
    return { width: m.width, height: m.height };
  }

  async generatePreview(input: Buffer): Promise<Buffer> {
    return sharp(input).rotate().resize({ width: PREVIEW_WIDTH, withoutEnlargement: true }).jpeg({ quality: 85, progressive: true }).toBuffer();
  }

  /** Preview basse définition avec filigrane répété (texte du studio ou TRACK.ART) */
  async generateWatermark(input: Buffer, text = 'TRACK.ART'): Promise<Buffer> {
    const preview = await sharp(input).rotate().resize({ width: PREVIEW_WIDTH, withoutEnlargement: true }).toBuffer();
    const { width, height } = await sharp(preview).metadata();
    const svg = this.buildWatermarkSvg(width ?? PREVIEW_WIDTH, height ?? 800, text);
    return sharp(preview).composite([{ input: Buffer.from(svg), blend: 'over' }]).jpeg({ quality: 78, progressive: true }).toBuffer();
  }

  private buildWatermarkSvg(width: number, height: number, rawText: string): string {
    const text = (rawText || 'TRACK.ART').toUpperCase().replace(/[<>&"']/g, '').slice(0, 40);
    const fontSize = Math.max(22, Math.floor(width / 24));
    const stepX = Math.max(fontSize * (text.length * 0.7 + 4), 200);
    const stepY = fontSize * 4;
    const cols = Math.ceil(width / stepX) + 3;
    const rows = Math.ceil(height / stepY) + 3;
    let elements = '';
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const x = c * stepX - 40 + (r % 2 ? stepX / 2 : 0);
        const y = r * stepY + fontSize;
        elements += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" opacity="0.38" fill="white" stroke="rgba(0,0,0,0.25)" stroke-width="1" font-size="${fontSize}" font-family="Georgia, 'Times New Roman', serif" letter-spacing="4">${text}</text>\n`;
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n${elements}</svg>`;
  }
}
