import { Injectable, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { ConfigService } from '@nestjs/config';
import { uuid } from 'short-uuid';
import { uuidToShortId } from 'src/common/short-id';

@Injectable()
export class MinioClientService {
  private readonly minioClient: Minio.Client;
  private readonly logger = new Logger(MinioClientService.name);

  constructor(private configService: ConfigService) {
    const endPoint = this.configService.get<string>(
      'MINIO_ENDPOINT',
      'localhost',
    );
    const port = Number(this.configService.get<string>('MINIO_PORT', '9000'));
    const useSSL =
      String(this.configService.get<string>('MINIO_USE_SSL', 'false')) ===
      'true';

    this.minioClient = new Minio.Client({
      endPoint,
      port,
      useSSL,
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });

    // Log the connection details manually
    const protocol = useSSL ? 'https' : 'http';
    this.logger.log(`Connected to MinIO at ${protocol}://${endPoint}:${port}`);
  }

  async uploadFile(
    id: string,
    file: { buffer: Buffer; size: number; mimetype: string },
    bucket: string,
  ) {
    const fileContent = file?.buffer;

    try {
      await this.minioClient.putObject(bucket, id, fileContent, file?.size, {
        'Content-Type': file?.mimetype,
      });

      this.logger.log(`Successfully uploaded file with id ${id} to MinIO.`);
    } catch (error) {
      this.logger.error(
        `Failed to upload file with id ${id}: ${error.message}`,
        error.stack,
      );
      throw error;
    }

    return id;
  }
  async deleteFile(bucket: string, id: string): Promise<boolean> {
    try {
      // Check if file exists first
      await this.minioClient.statObject(bucket, id);

      // Delete the object
      await this.minioClient.removeObject(bucket, id);

      this.logger.log(
        `Successfully deleted file with id ${id} from bucket ${bucket}`,
      );
      return true;
    } catch (error) {
      // Check if the error is "Not Found"
      if (error.code === 'NotFound' || error.message === 'Not Found') {
        this.logger.warn(`File with id ${id} not found in bucket ${bucket}`);
        return false;
      }

      // For other errors, log and rethrow
      this.logger.error(
        `Failed to delete file with id ${id} from bucket ${bucket}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  async getFile(
    bucket: string,
    id: string,
  ): Promise<{ buffer: Buffer; mimetype: string } | null> {
    try {
      // Get the object stats to retrieve the MIME type
      const stat = await this.minioClient.statObject(bucket, id);
      if (!stat) {
        return null;
      }
      const mimetype =
        stat.metaData['content-type'] || 'application/octet-stream';

      // Get the object data
      const dataStream = await this.minioClient.getObject(bucket, id);
      const chunks: Buffer[] = [];

      for await (const chunk of dataStream) {
        chunks.push(chunk);
      }

      return {
        buffer: Buffer.concat(chunks),
        mimetype,
      };
    } catch (error) {
      // Check if the error is "Not Found" and return null instead of throwing
      if (error.code === 'NotFound' || error.message === 'Not Found') {
        this.logger.warn(`File with id ${id} not found in bucket ${bucket}`);
        return null;
      }

      // For other errors, log and rethrow
      this.logger.error(
        `Failed to get file with id ${id} from bucket ${bucket}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async deleteFiles(bucket: string, ids: string[]): Promise<void> {
    try {
      await this.minioClient.removeObjects(bucket, ids);
      this.logger.log(
        `Successfully deleted ${ids.length} files from bucket ${bucket}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to delete files from bucket ${bucket}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  async checkRequiredBuckets(): Promise<void> {
    const required = ['components', 'images', 'public', 'projects'];
    const present = await Promise.all(
      required.map((bucket) => this.minioClient.bucketExists(bucket)),
    );
    const missing = required.filter((_, index) => !present[index]);
    if (missing.length) {
      throw new Error(`Missing MinIO buckets: ${missing.join(', ')}`);
    }
  }
}
