import { jsonParseStream, jsonStringifyStream, setupMultiplex } from './streams';

describe('streams', () => {
  describe('jsonParseStream', () => {
    it('returns a transform stream', () => {
      const stream = jsonParseStream();
      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
      expect(stream.writable).toBe(true);
    });

    it('parses JSON string to object', (done) => {
      const stream = jsonParseStream();
      const input = JSON.stringify({ test: 'hello' });

      stream.on('data', (data) => {
        expect(data).toEqual({ test: 'hello' });
        done();
      });

      stream.write(input);
    });
  });

  describe('jsonStringifyStream', () => {
    it('returns a transform stream', () => {
      const stream = jsonStringifyStream();
      expect(stream).toBeDefined();
      expect(stream.readable).toBe(true);
      expect(stream.writable).toBe(true);
    });

    it('stringifies object to JSON string', (done) => {
      const stream = jsonStringifyStream();

      stream.on('data', (data) => {
        expect(data).toBe('{"test":"hello"}');
        done();
      });

      stream.write({ test: 'hello' });
    });
  });

  describe('setupMultiplex', () => {
    it('returns a mux stream', () => {
      const mockStream = {
        pipe: jest.fn().mockReturnThis(),
        on: jest.fn(),
      };
      const mux = setupMultiplex(mockStream);
      expect(mux).toBeDefined();
    });
  });
});
