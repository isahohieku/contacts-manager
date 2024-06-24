import { Tag } from '../../tags/entities/tag.entity';
import { AddressType } from '../../address-types/entities/address-type.entity';
import { Phone } from '../../phones/entities/phone.entity';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';
import { Email } from '../../emails/entities/email.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';
import { Address } from '../../addresses/entities/address.entity';
import { Role } from '../../roles/entities/role.entity';
import { Status } from '../../statuses/entities/status.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entity/user.entity';
import { Country } from '../../countries/entities/country.entity';

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
