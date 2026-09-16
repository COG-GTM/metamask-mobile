import { stringToBytes } from '@metamask/utils';
import { pbkdf2 } from './pbkdf2';

const mockPassword = 'mockPassword';
const mockSalt = '00112233445566778899001122334455';

describe('pbkdf2', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('derives a key', async () => {
    const mockPasswordBytes = stringToBytes(mockPassword);
    const mockSaltBytes = stringToBytes(mockSalt);
    const mockIterations = 2048;
    const mockKeyLength = 64; // 512 bits

    await expect(
      pbkdf2(mockPasswordBytes, mockSaltBytes, mockIterations, mockKeyLength),
    ).resolves.toBeDefined();
  });

  it('does not fail when empty password', async () => {
    const mockPasswordBytes = stringToBytes('');
    const mockSaltBytes = stringToBytes(mockSalt);

    const result = await pbkdf2(mockPasswordBytes, mockSaltBytes, 2048, 64);
    expect(result).toBeDefined();
  });

  it('does not fail when empty salt', async () => {
    const mockPasswordBytes = stringToBytes(mockPassword);
    const mockSaltBytes = stringToBytes('');

    const result = await pbkdf2(mockPasswordBytes, mockSaltBytes, 2048, 64);
    expect(result).toBeDefined();
  });
});
