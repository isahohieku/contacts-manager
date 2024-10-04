import * as fs from 'fs';
import * as path from 'path';

import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { HttpStatus, Injectable } from '@nestjs/common';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import multerS3 from 'multer-s3';

import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';
import { handleError } from '../../shared/utils/handlers/error.handler';

import type { Response } from 'express';

@Injectable()
export class FileStorageService {
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    // Initialize the AWS S3 client
    this.s3Client = new S3Client({
      region: this.configService.get('file.awsS3Region'),
      credentials: {
        accessKeyId: this.configService.get('file.accessKeyId'),
        secretAccessKey: this.configService.get('file.secretAccessKey'),
      },
    });
  }

  /**
   * Checks if the file storage driver is set to S3.
   *
   * @return {boolean} True if the driver is S3, false otherwise
   */
  private getIsS3Driver(): boolean {
    return this.configService.get('file.driver') === 's3';
  }

  /**
   * Returns a disk storage engine configuration for local file storage.
   *
   * @return {DiskStorageOptions} A disk storage engine configuration object.
   */
  private getLocalStorage() {
    return diskStorage({
      destination: './files',
      filename: (_, file, callback) => {
        const fileExt = file.originalname.split('.').pop().toLowerCase();
        callback(null, `${randomStringGenerator()}.${fileExt}`);
      },
    });
  }

  /**
   * Returns a multer-s3 storage engine configuration for S3 file storage.
   *
   * @return {multerS3.StorageEngine} A multer-s3 storage engine configuration object.
   */
  private getS3Storage() {
    return multerS3({
      s3: this.s3Client,
      bucket: this.configService.get('file.awsDefaultS3Bucket'),
      acl: 'public-read',
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (_, file, callback) => {
        const fileExt = file.originalname.split('.').pop().toLowerCase();
        callback(null, `${randomStringGenerator()}.${fileExt}`);
      },
    });
  }

  /**
   * Removes a file from local storage.
   *
   * @param {string} filePath - The path of the file to be removed.
   * @return {void}
   */
  private removeFromLocalStorage(filePath: string) {
    const file = filePath.split('/').pop();
    const fullPath = path.join(__dirname, '..', '..', '..', 'files', file);

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

  /**
   * Asynchronously removes a file from S3 storage using @aws-sdk/client-s3.
   *
   * @param {string} filePath - The path of the file to be removed.
   * @return {Promise<void>} A promise that resolves when the file is successfully removed.
   * @throws {Error} If there is an error deleting the file.
   */
  private async removeFromS3Storage(filePath: string) {
    const bucket = this.configService.get('file.awsDefaultS3Bucket');
    const key = filePath.replace(/^.*\/\/[^\/]+/, ''); // Remove URL part

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
      );
    } catch (err) {
      throw handleError(
        HttpStatus.INTERNAL_SERVER_ERROR,
        `Failed to delete S3 file: ${filePath}`,
        { file: err.message },
      );
    }
  }

  /**
   * Returns the storage type based on the current driver configuration.
   *
   * @return {object} The storage object, either S3 or local storage.
   */
  getStorage() {
    return this.getIsS3Driver() ? this.getS3Storage() : this.getLocalStorage();
  }

  /**
   * Removes a file from storage based on the current driver configuration.
   *
   * @param {string} filePath - The path of the file to be removed.
   * @return {Promise<void>} A promise that resolves when the file has been removed.
   */
  removeFromStorage(filePath: string) {
    return this.getIsS3Driver()
      ? this.removeFromS3Storage(filePath)
      : this.removeFromLocalStorage(filePath);
  }

  /**
   * Retrieves a file from storage and streams it to the response.
   *
   * @param {string} filePath - The path of the file to be retrieved.
   * @param {Response} res - The response object to stream the file to.
   * @return {Promise<void>} A promise that resolves when the file has been streamed.
   */
  async getFile(filePath: string, res: Response) {
    const fullPath = path.join(__dirname, '..', '..', '..', 'files', filePath);

    // Check if the file exists
    if (fs.existsSync(fullPath)) {
      const imageStream = fs.createReadStream(fullPath);
      return imageStream.pipe(res);
    } else {
      throw handleError(
        HttpStatus.NOT_FOUND,
        ERROR_MESSAGES.NOT_FOUND_WITHOUT_ID('File'),
        {
          file: 'Image not found',
        },
      );
    }
  }
}
