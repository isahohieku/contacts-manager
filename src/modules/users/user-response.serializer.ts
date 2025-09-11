import { User } from './entity/user.entity';

const userResponseSerializer = (user: User): void => {
  // Use Reflect.deleteProperty for type-safe property deletion
  Reflect.deleteProperty(user, 'password');
  Reflect.deleteProperty(user, 'hash');
  Reflect.deleteProperty(user, 'previousPassword');
};

export default userResponseSerializer;
