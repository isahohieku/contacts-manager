export const password = 'passwords';

const base = {
  email: 'john.doe@test.com',
  firstName: 'John',
  lastName: 'Doe',
  country: { id: 162 },
  provider: { id: 1 },
};

export const userData = {
  ...base,
  id: undefined,
  role: { id: 2 },
  status: { id: 2 },
};

export const userSignUpDetails = { ...base, password };
