import { SearchTypes } from '../types/contacts.type';

const contactProperties = [
  'firstName',
  'job_title',
  'lastName',
  'notes',
  'organization',
];

const addressProperties = [
  'addresses.address_type.name',
  'addresses.city',
  'addresses.street',
  'addresses.country.code',
];

const emailProperties = ['emails.email_address', 'emails.email_type.name'];

const phoneProperties = [
  'phone_numbers.phone_number',
  'phone_numbers.phone_type.name',
];

const tagProperties = ['tags.name'];

export const allProperties = [
  ...contactProperties,
  ...addressProperties,
  ...emailProperties,
  ...phoneProperties,
  ...tagProperties,
];

export const searchTypes = {
  [SearchTypes.CONTACT]: contactProperties,
  [SearchTypes.ADDRESS]: addressProperties,
  [SearchTypes.EMAIL]: emailProperties,
  [SearchTypes.PHONE_NUMBER]: phoneProperties,
  [SearchTypes.TAG]: tagProperties,
};
