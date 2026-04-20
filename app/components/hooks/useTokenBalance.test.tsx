import { renderHook } from '@testing-library/react-hooks';
import useTokenBalance from './useTokenBalance';
import Engine from '../../core/Engine';

jest.mock('../../core/Engine', () => ({
  __esModule: true,
  default: {
    context: {
      AssetsContractController: {
        getERC20BalanceOf: jest.fn(),
      },
    },
  },
}));

describe('useTokenBalance', () => {
  const getBalance = () =>
    (Engine.context as unknown as {
      AssetsContractController: { getERC20BalanceOf: jest.Mock };
    }).AssetsContractController.getERC20BalanceOf;

  beforeEach(() => {
    getBalance().mockReset();
  });

  it('returns balance on success', async () => {
    const mockBalance = { toString: () => '123' } as unknown;
    getBalance().mockResolvedValue(mockBalance);

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenBalance('0xtoken', '0xuser'),
    );

    expect(result.current[1]).toBe(true);
    await waitForNextUpdate();

    expect(result.current[0]).toBe(mockBalance);
    expect(result.current[1]).toBe(false);
    expect(result.current[2]).toBe(false);
  });

  it('sets error state when fetching rejects', async () => {
    getBalance().mockRejectedValue(new Error('nope'));

    const { result, waitForNextUpdate } = renderHook(() =>
      useTokenBalance('0xtoken', '0xuser'),
    );

    await waitForNextUpdate();
    expect(result.current[2]).toBe(true);
    expect(result.current[1]).toBe(false);
  });
});
