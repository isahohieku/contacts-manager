const password = 'passwords';

const base = {
  email: 'john.doe@admin.com',
  firstName: 'John',
  lastName: 'Doe',
  country: { id: 162 },
};

export const userData = {
  ...base,
  id: undefined,
  provider: 'email',
  role: { id: 1 },
  status: { id: 1 },
};

export const userSignUpDetails = { ...base, password };
