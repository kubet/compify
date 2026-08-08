import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  InternalServerErrorException,
  Res,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ComponentService } from './component.service';
import { JwtUserGuard } from 'src/common/guards/jwt-user.guard';
import { User } from 'src/entities/user/user.entity';
import { GetUser } from 'src/common/get-user.decorator';
import { CreateComponentDto } from 'src/models/component/create-component.dto';
import { MinioClientService } from '../minio/minio.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ConstructImageService } from './construct-image.service';
import sharp from 'sharp';
import {
  ForkComponentDto,
  ReportComponentDto,
  SearchComponentsDto,
  UpvoteComponentDto,
} from 'src/models/component/component-actions.dto';
@ApiTags('Components')
@ApiBrowserOrBearerAuth()
@Controller('component')
@UseGuards(JwtUserGuard)
export class ComponentController {
  constructor(
    private readonly componentService: ComponentService,
    private readonly minioService: MinioClientService,
    private readonly constructImageService: ConstructImageService,
  ) {}

  @Post('search')
  search(@Body() body: SearchComponentsDto, @GetUser() user: User) {
    return this.componentService.search(body, user);
  }

  @Get('image/:id')
  async getImage(
    @Param('id') id: string,
    @GetUser() user: User,
    @Res() res: Response,
  ) {
    try {
      // This authenticated endpoint is used by the private editor. Public
      // images are served by /c/image/:id; never let any signed-in user use
      // this route to enumerate another user's private component images.
      await this.componentService.checkIfUserIsOwnerOrThrow403(id, user);
      const { buffer, mimetype } = await this.minioService.getFile(
        'images',
        id,
      );
      if (!buffer) {
        res.status(404).json({ message: 'Image not found' });
      }
      // Set appropriate headers
      res.setHeader('Content-Type', mimetype);
      res.setHeader('Content-Length', buffer?.length);

      // Send the buffer and end the response
      res.end(buffer);
    } catch (error) {
      console.error('Error retrieving image:', error);
      res.status(404).json({ message: 'Image not found or error occurred' });
    }
  }

  @Post('image/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('id') componentId: string,
    @GetUser() user: User,
  ) {
    if (!file) {
      throw new BadRequestException('A WebP image file is required');
    }
    await this.componentService.checkIfUserIsOwnerOrThrow403(componentId, user);
    if (file.mimetype !== 'image/webp') {
      throw new BadRequestException('Only WebP images are accepted');
    }
    const metadata = await sharp(file.buffer)
      .metadata()
      .catch(() => null);
    if (metadata?.format !== 'webp') {
      throw new BadRequestException(
        'The uploaded file is not a valid WebP image',
      );
    }
    // Add size limit check (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size exceeds the maximum limit of 2MB',
      );
    }

    const bucketName = 'images';
    const objectName = `${componentId}`;

    try {
      await this.minioService.uploadFile(
        objectName,
        {
          buffer: file.buffer,
          size: file.size,
          mimetype: file.mimetype,
        },
        bucketName,
      );
      await this.componentService.updateComponentImageUploaded(componentId);
      return { message: 'File uploaded successfully' };
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  @Post('share/:id')
  share(@Param('id') id: string, @GetUser() user: User) {
    return this.componentService.share(id, user);
  }

  @Post('create')
  create(@Body() body: CreateComponentDto, @GetUser() user: User) {
    return this.componentService.create(body, user);
  }

  @Post('fork')
  fork(@Body() body: ForkComponentDto, @GetUser() user: User) {
    return this.componentService.fork(body, user);
  }

  @Post('can/create')
  checkIfCanCreate(@GetUser() user: User) {
    return this.componentService.checkIfCanCreate(user);
  }

  @Get('my')
  findAllMy(
    @Query('page') page: number,
    @Query('term') term: string,
    @Query('filter') filter: string,
    @GetUser() user: User,
  ) {
    return this.componentService.findAllMy(page, term, filter, user);
  }

  @Get('external')
  findAllExternal() {
    return this.componentService.findAllExternal();
  }

  @Get('my/recent')
  findRecentMy(@GetUser() user: User) {
    return this.componentService.findRecentMy(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.componentService.findOne(id, user);
  }

  @Post('upvote')
  upvote(@Body() body: UpvoteComponentDto, @GetUser() user: User) {
    return this.componentService.upvote(body, user);
  }

  @Get('check/domain')
  checkDomain(@Query('domain') domain: string, @Query('id') id: string) {
    return this.componentService.checkDomain(domain, id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.componentService.remove(id, user);
  }

  @Post('report/:id')
  reportComponent(
    @Param('id') id: string,
    @Body() body: ReportComponentDto,
    @GetUser() user: User,
  ) {
    return this.componentService.reportComponent(id, body.reason, user);
  }

  @Post('gif/create')
  async getAnimatedImg(
    @Body('captures') captures: unknown,
    @Body('id') id: unknown,
    @GetUser() user: User,
  ) {
    if (
      !Array.isArray(captures) ||
      captures.length === 0 ||
      captures.length > 5 ||
      !captures.every(
        (capture): capture is string =>
          typeof capture === 'string' && capture.length > 0,
      )
    ) {
      throw new BadRequestException(
        'Captures must be an array of one to five non-empty strings',
      );
    }
    if (typeof id !== 'string' || id.trim().length === 0) {
      throw new BadRequestException('Id is required');
    }
    await this.componentService.checkIfUserIsOwnerOrThrow403(id, user);
    const base64 =
      await this.constructImageService.constructAnimatedImg(captures);

    const bucketName = 'images';
    const objectName = `${id}`;

    try {
      // Convert base64 to buffer
      const buffer = Buffer.from(base64.split(',')[1], 'base64');

      await this.minioService.uploadFile(
        objectName,
        {
          buffer,
          size: buffer.length,
          mimetype: 'image/gif',
        },
        bucketName,
      );
      await this.componentService.updateComponentImageUploaded(id);
      return { message: 'File uploaded successfully' };
    } catch (error) {
      console.error('Error uploading to MinIO:', error);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }
}
