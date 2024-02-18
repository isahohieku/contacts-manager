import { Tag } from 'src/tags/entities/tag.entity';
import { AddressType } from '../../address-types/entities/address-type.entity';
import { Phone } from 'src/phones/entities/phone.entity';
import { PhoneType } from 'src/phone-types/entities/phone-type.entity';
import { Email } from '../../emails/entities/email.entity';
import { EmailType } from 'src/email-types/entities/email-type.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Status } from 'src/statuses/entities/status.entity';
import { Contact } from 'src/contacts/entities/contact.entity';
import { User } from 'src/users/entity/user.entity';

export const repositories = {
  User,
  Contact,
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
