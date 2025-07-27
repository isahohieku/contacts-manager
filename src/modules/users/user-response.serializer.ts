import { User } from './entity/user.entity';

const userResponseSerializer = (user: User) => {
  delete (user as any).password;
  delete (user as any).hash;
  delete (user as any).previousPassword;
};

export default userResponseSerializer;
