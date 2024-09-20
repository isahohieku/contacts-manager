import { CountryCode, isValidPhoneNumber } from 'libphonenumber-js';

export const validatePhoneNumber = (
  phoneNumber: string,
  country: CountryCode,
): boolean => {
  // Check if number starts with + or double zeros
  if (phoneNumber.startsWith('+') || phoneNumber.startsWith('00'))
    return isValidPhoneNumber(phoneNumber);

  // Check phone number based on user's country
  return isValidPhoneNumber(phoneNumber, country);
};
