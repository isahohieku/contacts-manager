import { HttpStatus, Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import * as AWS from 'aws-sdk';
import multerS3 from 'multer-s3';
import { FilesService } from './files.service';
import { handleError } from '../utils/handlers/error.handler';
import { FilesErrorCodes } from '../utils/constants/files/errors';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const storages = {
          local: () =>
            diskStorage({
              destination: './files',
              filename: (_, file, callback) => {
                callback(
                  null,
                  `${randomStringGenerator()}.${file.originalname
                    .split('.')
                    .pop()
                    .toLowerCase()}`,
                );
              },
            }),
          s3: () => {
            const s3 = new AWS.S3();
            AWS.config.update({
              accessKeyId: configService.get('file.accessKeyId'),
              secretAccessKey: configService.get('file.secretAccessKey'),
              region: configService.get('file.awsS3Region'),
            });

            return multerS3({
              s3: s3,
              bucket: configService.get('file.awsDefaultS3Bucket'),
              acl: 'public-read',
              contentType: multerS3.AUTO_CONTENT_TYPE,
              key: (_, file, callback) => {
                callback(
                  null,
                  `${randomStringGenerator()}.${file.originalname
                    .split('.')
                    .pop()
                    .toLowerCase()}`,
                );
              },
            });
          },
        };

        return {
          fileFilter: (_, file, callback) => {
            if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
              const errors = {
                file: FilesErrorCodes.INVALID_FILE_TYPE,
              };
              // TODO: Handle error message
              return callback(
                handleError(HttpStatus.UNPROCESSABLE_ENTITY, '', errors),
                false,
              );
            }
            callback(null, true);
          },
          storage: storages[configService.get('file.driver')](),
          limits: {
            fileSize: configService.get('file.maxFileSize'),
          },
        };
      },
    }),
  ],
  controllers: [FilesController],
  providers: [ConfigModule, ConfigService, FilesService],
})
export class FilesModule {}
