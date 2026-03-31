// @ts-nocheck - TODO: Add proper type annotations in a follow-up PR
export default {
  captureScreen: jest.fn().mockImplementation(() => {
    // eslint-disable-next-line no-console
    console.log('capture screen');
  }),
};
