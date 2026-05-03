import { Injectable } from '@nestjs/common';
import * as sharp from 'sharp';

@Injectable()
export class ImageProcessingService {
  async generatePreview(input: Buffer): Promise<Buffer> {
    return (sharp as any)(input)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 85, progressive: true })
      .toBuffer();
  }

  async generateWatermark(input: Buffer): Promise<Buffer> {
    const preview = await (sharp as any)(input)
      .resize({ width: 1200, withoutEnlargement: true })
      .toBuffer();

    const { width, height } = await (sharp as any)(preview).metadata();
    const svg = this.buildWatermarkSvg(width ?? 1200, height ?? 800);

    return (sharp as any)(preview)
      .composite([{ input: Buffer.from(svg), blend: 'over' }])
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
  }

  private buildWatermarkSvg(width: number, height: number): string {
    const text = 'TRACK.ART';
    const fontSize = Math.max(24, Math.floor(width / 22));
    const stepX = fontSize * 8;
    const stepY = fontSize * 4;
    const cols = Math.ceil(width / stepX) + 3;
    const rows = Math.ceil(height / stepY) + 3;

    let elements = '';
    for (let r = -1; r < rows; r++) {
      for (let c = -1; c < cols; c++) {
        const x = c * stepX - 40;
        const y = r * stepY + fontSize;
        elements += `<text x="${x}" y="${y}" transform="rotate(-30 ${x} ${y})" opacity="0.35" fill="white" font-size="${fontSize}" font-family="Arial, sans-serif" font-weight="bold" letter-spacing="3">${text}</text>\n`;
      }
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n${elements}</svg>`;
  }
}
