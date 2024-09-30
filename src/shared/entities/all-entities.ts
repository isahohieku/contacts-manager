import { AddressType } from '../../modules/address-types/entities/address-type.entity';
import { Address } from '../../modules/addresses/entities/address.entity';
import { Contact } from '../../modules/contacts/entities/contact.entity';
import { Country } from '../../modules/countries/entities/country.entity';
import { EmailType } from '../../modules/email-types/entities/email-type.entity';
import { Email } from '../../modules/emails/entities/email.entity';
import { PhoneType } from '../../modules/phone-types/entities/phone-type.entity';
import { Phone } from '../../modules/phones/entities/phone.entity';
import { Role } from '../../modules/roles/entities/role.entity';
import { Status } from '../../modules/statuses/entities/status.entity';
import { Tag } from '../../modules/tags/entities/tag.entity';
import { User } from '../../modules/users/entity/user.entity';

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
