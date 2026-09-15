declare module '@react-native-clipboard/clipboard/jest/clipboard-mock.js' {
  const RNCClipboardMock: {
    getString: jest.Mock;
    getImagePNG: jest.Mock;
    getImageJPG: jest.Mock;
    setImage: jest.Mock;
    setString: jest.Mock;
    hasString: jest.Mock;
    hasImage: jest.Mock;
    hasURL: jest.Mock;
    addListener: jest.Mock;
    removeAllListeners: jest.Mock;
    getEnforcing: jest.Mock;
    useClipboard: jest.Mock;
  };
  export = RNCClipboardMock;
}
