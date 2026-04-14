import { jsonParseStream, jsonStringifyStream, setupMultiplex } from './streams';

jest.mock('@metamask/object-multiplex', () => jest.fn(() => ({})));
jest.mock('pump', () => jest.fn());

describe('streams', () => {
  it('should export jsonParseStream function', () => {
    expect(typeof jsonParseStream).toBe('function');
  });

  it('should export jsonStringifyStream function', () => {
    expect(typeof jsonStringifyStream).toBe('function');
  });

  it('should export setupMultiplex function', () => {
    expect(typeof setupMultiplex).toBe('function');
  });

  it('setupMultiplex should return a mux object', () => {
    const mockStream = {};
    const result = setupMultiplex(mockStream);
    expect(result).toBeDefined();
  });
});
