import { HttpStatus } from '@nestjs/common';

import { FilesErrorCodes } from '../utils/constants/files/errors';
import { handleError } from '../utils/handlers/error.handler';

import { FileTypes } from './types/files.type';

const allowedImageFileTypes = /\.(jpg|jpeg|png|gif)$/i;
const allowedDocumentFileTypes = /\.(pdf)$/i;
const allowedImportFileTypes = /\.(csv|xls|xlsx)$/;

const fileTypes: Record<FileTypes, RegExp> = {
  image: allowedImageFileTypes,
  document: allowedDocumentFileTypes,
  csv: allowedImportFileTypes,
};

export const fileFilter = (req, file, callback) => {
  const { type = FileTypes.CSV } = req.query as { type: FileTypes };

  if (!file.originalname.match(fileTypes[type])) {
    const errors = { file: FilesErrorCodes.INVALID_FILE_TYPE };
    return callback(
      handleError(HttpStatus.UNPROCESSABLE_ENTITY, '', errors),
      false,
    );
  }

  callback(null, true);
};
