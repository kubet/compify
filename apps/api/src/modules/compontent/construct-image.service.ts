import { Injectable } from '@nestjs/common';
import { MinioClientService } from '../minio/minio.service';
import * as sharpNamespace from 'sharp';
import type sharpDefault from 'sharp';

const sharp =
  (sharpNamespace as unknown as { default?: typeof sharpDefault }).default ??
  (sharpNamespace as unknown as typeof sharpDefault);
import * as path from 'path';
import * as fs from 'fs/promises';

@Injectable()
export class ConstructImageService {
  constructor(private readonly minioService: MinioClientService) {}

  async constructOGImage(id: string, name: string) {
    const file = await this.minioService.getFile('images', id);
    if (!file || !file.buffer) {
      return null;
    }
    const { buffer } = file;
    const templateBuffer = await this.ensureTemplate();

    // Get template dimensions
    const templateMetadata = await sharp(templateBuffer).metadata();

    const processedImage = await sharp(buffer)
      .ensureAlpha()
      .rotate(15, {
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .resize(500, 500, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        withoutEnlargement: true,
        kernel: 'lanczos3',
      })
      .toBuffer({ resolveWithObject: true });

    // Get processed image dimensions
    const processedMetadata = await sharp(processedImage.data).metadata();

    // Calculate vertical center position
    const verticalPosition = Math.max(
      0,
      Math.floor((templateMetadata.height - processedMetadata.height) / 2),
    );

    // Add this function to segment the name
    const segmentText = (
      text: string,
      maxCharsPerLine = 14,
      maxLines = 4,
    ): string => {
      // First try to split by camelCase
      const splitCamelCase = (word: string): string[] => {
        return word.split(/(?=[A-Z])/).filter(Boolean);
      };

      // Split input by spaces and then by camelCase
      const words = text.split(' ').flatMap((word) => {
        if (word.length > maxCharsPerLine) {
          return splitCamelCase(word);
        }
        return [word];
      });

      const lines: string[] = [];
      let currentLine = '';

      for (const word of words) {
        if (lines.length >= maxLines) {
          lines[maxLines - 1] = lines[maxLines - 1].slice(0, -3) + '...';
          break;
        }

        if ((currentLine + word).length <= maxCharsPerLine) {
          currentLine += (currentLine ? ' ' : '') + word;
        } else {
          if (currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            // If a single word is still longer than maxCharsPerLine after camelCase split
            lines.push(word.slice(0, maxCharsPerLine - 3) + '...');
            continue;
          }
        }
      }

      if (currentLine && lines.length < maxLines) {
        lines.push(currentLine);
      }

      return lines.join('\n');
    };

    const segmentedName = segmentText(name);
    const finalImage = await sharp(templateBuffer)
      .composite([
        {
          input: processedImage.data,
          gravity: 'east',
          top: verticalPosition,
          left: 700,
          blend: 'over',
        },
        {
          input: {
            text: {
              text: `<span foreground="white" weight="900">Check out my\n${segmentedName}</span>`,
              fontfile: path.join(process.cwd(), 'files/wolf2.ttf'),
              dpi: 400,
              width: 700,
              align: 'left',
              rgba: true,
            },
          },
          top: 80,
          left: 60,
          blend: 'over',
        },
      ])
      .webp({ quality: 90 })
      .toBuffer();

    const objectName = `${id}-og`; // Added .webp extension
    await this.minioService.uploadFile(
      objectName,
      {
        buffer: finalImage,
        size: finalImage.length,
        mimetype: 'image/webp', // Changed mimetype to webp
      },
      'images',
    );
    return {
      buffer: finalImage,
      mimetype: 'image/webp', // Changed mimetype to webp
    };
  }

  private async ensureTemplate() {
    const templatePath = path.join(process.cwd(), 'files', 'og-template.png');
    try {
      const templateBuffer = await fs.readFile(templatePath);
      // Compress the template image before using it
      return await sharp(templateBuffer).webp({ quality: 60 }).toBuffer();
    } catch (error) {
      throw new Error(`OG template image not found at ${templatePath}`);
    }
  }

  async constructAnimatedImg(captures: string[]): Promise<string> {
    try {
      if (!captures?.length) {
        throw new Error('No images provided');
      }

      // Get dimensions from first image
      const firstImage = await sharp(
        Buffer.from(
          captures[0].replace(/^data:image\/\w+;base64,/, ''),
          'base64',
        ),
      );
      const firstImageMetadata = await firstImage.metadata();

      if (!firstImageMetadata.width || !firstImageMetadata.height) {
        throw new Error('Invalid first image dimensions');
      }

      const scale = 0.6;
      const standardWidth = Math.min(
        Math.max(Math.floor(firstImageMetadata.width * scale), 1),
        16777215,
      );
      const standardHeight = Math.min(
        Math.max(Math.floor(firstImageMetadata.height * scale), 1),
        16777215,
      );

      const frames = await Promise.all(
        captures.map((dataUrl, index) =>
          this.validateAndProcessImage(
            dataUrl,
            standardWidth,
            standardHeight,
            index,
          ),
        ),
      );

      // Sharp/libvips can join equal-size images as animation pages, avoiding a
      // separate WebAssembly muxer whose complete corresponding source was not
      // conveyed by its npm artifact.
      const buffer = await sharp(frames, {
        join: { across: 1, animated: true },
      })
        .webp({
          quality: 75,
          alphaQuality: 100,
          loop: 0,
          delay: frames.map(() => 600),
        })
        .toBuffer();

      console.log(
        `Successfully created animation with ${frames.length} frames`,
      );
      return `data:image/webp;base64,${buffer.toString('base64')}`;
    } catch (error) {
      console.error('Animation creation failed:', error);
      throw error;
    }
  }

  private async validateAndProcessImage(
    dataUrl: string,
    targetWidth: number,
    targetHeight: number,
    index: number,
  ): Promise<Buffer> {
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error(`Invalid data URL format for image ${index}`);
    }

    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '');
    const inputBuffer = Buffer.from(base64Data, 'base64');

    return sharp(inputBuffer)
      .ensureAlpha()
      .resize(targetWidth, targetHeight, {
        fit: 'contain',
        position: 'center',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({
        quality: 75,
        alphaQuality: 100,
        lossless: false,
      })
      .toBuffer();
  }
}
