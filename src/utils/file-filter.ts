import { HttpStatus } from '@nestjs/common';
import { handleError } from '../utils/handlers/error.handler';
import { FilesErrorCodes } from '../utils/constants/files/errors';
import { FileTypes } from './types/files.type';

const allowedImageFileTypes = /\.(jpg|jpeg|png|gif)$/i;
const allowedDocumentFileTypes = /\.(pdf)$/i;

const fileTypes: Record<FileTypes, RegExp> = {
  image: allowedImageFileTypes,
  document: allowedDocumentFileTypes,
};

export const fileFilter = (req, file, callback) => {
  const { type = FileTypes.IMAGE } = req.query as { type: FileTypes };

  if (!file.originalname.match(fileTypes[type])) {
    const errors = { file: FilesErrorCodes.INVALID_FILE_TYPE };
    return callback(
      handleError(HttpStatus.UNPROCESSABLE_ENTITY, '', errors),
      false,
    );
  }

  callback(null, true);
};
