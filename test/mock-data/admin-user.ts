const password = 'passwords';

const base = {
  email: 'john.doe@admin.com',
  firstName: 'John',
  lastName: 'Doe',
  country: { id: 162 },
  provider: { id: 1 },
};

export const userData = {
  ...base,
  id: undefined,
  role: { id: 1 },
  status: { id: 1 },
};

export const userSignUpDetails = { ...base, password };
