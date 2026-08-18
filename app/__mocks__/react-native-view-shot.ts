const viewShot = {
  captureScreen: jest.fn<void, []>().mockImplementation(() => {
    // eslint-disable-next-line no-console
    console.log('capture screen');
  }),
};

export default viewShot;
