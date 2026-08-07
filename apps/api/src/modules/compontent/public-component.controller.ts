import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { ConstructImageService } from './construct-image.service';
import { MinioClientService } from '../minio/minio.service';
import { ComponentService } from './component.service';

@ApiTags('Public components')
@Controller('c')
export class PublicComponentController {
  constructor(
    private readonly minioService: MinioClientService,
    private readonly componentService: ComponentService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/og-image/:id')
  async getImageOg(@Param('id') id: string, @Res() res: Response) {
    const DEFAULT_OG_IMAGE = 'default-og.webp'; // Consistent default image name

    try {
      await this.componentService.checkIfComponentIsPublicOrThrow404(id);

      // Try to get the component's OG image
      const result = await this.minioService
        .getFile('images', id + '-og')
        .catch(() => null);

      // If component OG image not found or invalid, get default image
      if (!result?.buffer) {
        const defaultImage = await this.minioService.getFile(
          'public',
          DEFAULT_OG_IMAGE,
        );
        if (!defaultImage?.buffer) {
          throw new Error('Default image not found');
        }

        res.setHeader('Content-Type', defaultImage.mimetype);
        res.setHeader('Content-Length', defaultImage.buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.end(defaultImage.buffer);
      }

      // Set headers and return the component's OG image
      res.setHeader('Content-Type', result.mimetype);
      res.setHeader('Content-Length', result.buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      return res.end(result.buffer);
    } catch (error) {
      console.error('Error retrieving image:', error);
      return res
        .status(404)
        .json({ message: 'Image not found or error occurred' });
    }
  }

  @Get('info/:id')
  async getComponent(@Param('id') id: string) {
    return await this.componentService.getPublicComponent(id);
  }

  @ApiSecurity('internal-api-key')
  @Get('fetch/sitemap/all')
  async getAllComponentsForSitemap(@Headers() headers: Record<string, string>) {
    const apiKey = headers['x-api-key'];
    const expected = this.configService.get<string>('INTERNAL_API_TOKEN');
    if (!expected || apiKey !== expected) {
      throw new UnauthorizedException();
    }
    return await this.componentService.getAllComponentIdsForSitemap();
  }

  @Get('top-components')
  async getTopComponents() {
    return await this.componentService.getTopComponents();
  }

  @Post('search')
  async publicSearch(@Body() body: any) {
    return await this.componentService.search(body, null);
  }

  @Get('view')
  async viewComponent(@Query('slug') id: string) {
    return await this.componentService.viewOne(id);
  }

  @Get('image/:id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.componentService.checkIfComponentIsPublicOrThrow404(id);
      const { buffer, mimetype } = await this.minioService.getFile(
        'images',
        id,
      );
      if (!buffer) {
        return res.status(404).json({ message: 'Image not found' });
      }
      // Set appropriate headers
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Content-Length', buffer?.length);
      res.setHeader('Cache-Control', 'public, max-age=3600');

      // Send the buffer and end the response
      return res.end(buffer);
    } catch (error) {
      console.error('Error retrieving image:', error);
      if (!res.headersSent) {
        return res
          .status(404)
          .json({ message: 'Image not found or error occurred' });
      }
    }
  }
}
