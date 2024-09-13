import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import multerS3 from 'multer-s3';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { handleError } from '../utils/handlers/error.handler';

@Injectable()
export class FileStorageService {
  constructor(private readonly configService: ConfigService) {}

  private getLocalStorage() {
    return diskStorage({
      destination: './files',
      filename: (_, file, callback) => {
        const fileExt = file.originalname.split('.').pop().toLowerCase();
        callback(null, `${randomStringGenerator()}.${fileExt}`);
      },
    });
  }

  private getS3Storage() {
    const s3 = new AWS.S3();
    AWS.config.update({
      accessKeyId: this.configService.get('file.accessKeyId'),
      secretAccessKey: this.configService.get('file.secretAccessKey'),
      region: this.configService.get('file.awsS3Region'),
    });

    return multerS3({
      s3,
      bucket: this.configService.get('file.awsDefaultS3Bucket'),
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_, file, callback) => {
        const fileExt = file.originalname.split('.').pop().toLowerCase();
        callback(null, `${randomStringGenerator()}.${fileExt}`);
      },
    });
  }

  private removeFromLocalStorage(filePath: string) {
    const file = filePath.split('/').pop();
    const fullPath = path.join(__dirname, '..', '..', 'files', file);

    fs.unlink(fullPath, (err) => {
      if (err) {
        throw handleError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to delete local file: ${fullPath}`,
          err,
        );
      }
    });
  }

  private async removeFromS3Storage(filePath: string) {
    const s3 = new AWS.S3();
    const bucket = this.configService.get('file.awsDefaultS3Bucket');

    const key = filePath.replace(/^.*\/\/[^\/]+/, ''); // Remove URL part

    const params = {
      Bucket: bucket,
      Key: key,
    };

    await s3
      .deleteObject(params)
      .promise()
      .catch((err) => {
        throw handleError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          `Failed to delete S3 file: ${filePath}`,
          {
            file: err.message,
          },
        );
      });
  }

  getStorage() {
    const driver = this.configService.get('file.driver');
    return driver === 's3' ? this.getS3Storage() : this.getLocalStorage();
  }

  removeFromStorage(filePath: string) {
    const driver = this.configService.get('file.driver');
    return driver === 's3'
      ? this.removeFromS3Storage(filePath)
      : this.removeFromLocalStorage(filePath);
  }
}
