import { Tag } from '../../modules/tags/entities/tag.entity';
import { AddressType } from '../../modules/address-types/entities/address-type.entity';
import { Phone } from '../../modules/phones/entities/phone.entity';
import { PhoneType } from '../../modules/phone-types/entities/phone-type.entity';
import { Email } from '../../modules/emails/entities/email.entity';
import { EmailType } from '../../modules/email-types/entities/email-type.entity';
import { Address } from '../../modules/addresses/entities/address.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Status } from '../../modules/statuses/entities/status.entity';
import { Contact } from '../../modules/contacts/entities/contact.entity';
import { User } from '../../modules/users/entity/user.entity';
import { Country } from '../../modules/countries/entities/country.entity';

export const repositories = {
  User,
  Contact,
  Country,
  Status,
  Role,
  Address,
  AddressType,
  EmailType,
  Email,
  PhoneType,
  Phone,
  Tag,
};
