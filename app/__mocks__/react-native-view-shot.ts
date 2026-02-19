interface ViewShotMock {
  captureScreen: jest.Mock<void>;
}

const viewShotMock: ViewShotMock = {
  captureScreen: jest.fn().mockImplementation((): void => {
    // eslint-disable-next-line no-console
    console.log('capture screen');
  }),
};

export default viewShotMock;
