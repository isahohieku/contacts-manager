export const password = 'passwords';

const base = {
  email: 'john.doe@test.com',
  firstName: 'John',
  lastName: 'Doe',
  country: { id: 162 },
};

export const userData = {
  ...base,
  id: undefined,
  provider: 'email',
  role: { id: 2 },
  status: { id: 2 },
};

export const userSignUpDetails = { ...base, password };
