// The clipboard jest mock is published without type declarations, so the small
// part of its public surface used by the test setup is declared here.
declare module '@react-native-clipboard/clipboard/jest/clipboard-mock.js' {
  const mockClipboard: {
    getString: jest.Mock;
    setString: jest.Mock;
    hasString: jest.Mock;
    hasImage: jest.Mock;
    hasURL: jest.Mock;
    hasNumber: jest.Mock;
    hasWebURL: jest.Mock;
    addListener: jest.Mock;
    removeAllListeners: jest.Mock;
    useClipboard: jest.Mock;
  };
  export default mockClipboard;
}
