interface ViewShotMock {
  captureScreen: jest.Mock;
}

const viewShotMock: ViewShotMock = {
  captureScreen: jest.fn().mockImplementation(() => {
    // eslint-disable-next-line no-console
    console.log('capture screen');
  }),
};

export default viewShotMock;
