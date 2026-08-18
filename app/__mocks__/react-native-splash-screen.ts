const splashScreen = {
  show: jest.fn<void, []>().mockImplementation(() => {
    // eslint-disable-next-line no-console
    console.log('show splash screen');
  }),
  hide: jest.fn<void, []>().mockImplementation(() => {
    // eslint-disable-next-line no-console
    console.log('hide splash screen');
  }),
};

export default splashScreen;
