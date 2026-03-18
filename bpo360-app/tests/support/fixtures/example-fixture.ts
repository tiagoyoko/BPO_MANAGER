export type TestUser = {
  email: string;
  password: string;
};

export const makeTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  email: 'operador@example.com',
  password: 'Password123!',
  ...overrides,
});

