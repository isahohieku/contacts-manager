export const ERROR_MESSAGES = {
  // TODO: Make messages localised
  NOT_FOUND: (entity: string, id): string =>
    `${entity} with id ${id} could not be found`,
  NOT_FOUND_WITHOUT_ID: (entity: string): string =>
    `${entity} could not be found`,
  HASH_NOT_FOUND: 'User hash not found',
  INVALID: (entity: string): string => `${entity} is invalid`,
  REQUIRED: (entity: string): string => `${entity} is required`,
  ALREADY_EXIST: (entity: string, property: string): string =>
    `${entity} with ${property} already exist`,
  ALREADY_EXISTS_MAIN: (property: string): string =>
    `${property} already exist`,
  NOT_EXIST: (property: string): string => `${property} does not exist`,
  INVALID_PROVIDER: "This process can't be completed with this provider",
  UNVERIFIED_USER: 'Please verify your email address',
  INCORRECT_PASSWORD: 'Please verify user credentials and try again',
  MISSING_PASSWORD: 'Password is required',
  INTERNAL_SERVER_ERROR:
    "We're sorry, but something went wrong on our end. Please try again later. If the problem persists, contact our support team for assistance.",
  NO_FILE: 'File is required',
  FORBIDDEN_RESOURCE: 'You do not have permission to access this resource',
  UNAUTHORIZED: 'Unauthorized user',
};
