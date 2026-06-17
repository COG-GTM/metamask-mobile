import migrate from './006';

jest.mock('react-native-default-preference', () => ({
  __esModule: true,
  default: {
    set: jest.fn(() => Promise.resolve()),
    get: jest.fn(() => Promise.resolve()),
  },
}));

describe('Migration #6', () => {
  it('should return state unchanged while persisting default preferences', () => {
    const oldState = {};

    const newState = migrate(oldState);

    expect(newState).toStrictEqual({});
  });
});
