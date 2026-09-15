export default {
  captureScreen: jest.fn().mockImplementation((): void => {
    // eslint-disable-next-line no-console
    console.log('capture screen');
  }),
};
