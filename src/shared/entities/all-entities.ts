import { AddressType } from '@contactApp/modules/address-types/entities/address-type.entity';
import { Address } from '@contactApp/modules/addresses/entities/address.entity';
import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { Country } from '@contactApp/modules/countries/entities/country.entity';
import { EmailType } from '@contactApp/modules/email-types/entities/email-type.entity';
import { Email } from '@contactApp/modules/emails/entities/email.entity';
import { PhoneType } from '@contactApp/modules/phone-types/entities/phone-type.entity';
import { Phone } from '@contactApp/modules/phones/entities/phone.entity';
import { Role } from '@contactApp/modules/roles/entities/role.entity';
import { Status } from '@contactApp/modules/statuses/entities/status.entity';
import { Tag } from '@contactApp/modules/tags/entities/tag.entity';
import { User } from '@contactApp/modules/users/entity/user.entity';

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
