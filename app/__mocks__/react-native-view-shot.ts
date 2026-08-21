interface ViewShotMock {
  captureScreen: jest.Mock<void, []>;
}

const viewShot: ViewShotMock = {
  captureScreen: jest.fn().mockImplementation(() => {
    // eslint-disable-next-line no-console
    console.log('capture screen');
  }),
};

export default viewShot;
