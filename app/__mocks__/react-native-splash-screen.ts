interface SplashScreenMock {
  show: jest.Mock<void>;
  hide: jest.Mock<void>;
}

const splashScreenMock: SplashScreenMock = {
  show: jest.fn().mockImplementation((): void => {
    // eslint-disable-next-line no-console
    console.log('show splash screen');
  }),
  hide: jest.fn().mockImplementation((): void => {
    // eslint-disable-next-line no-console
    console.log('hide splash screen');
  }),
};

export default splashScreenMock;
