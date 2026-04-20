import { getAmount, getUsdAmount } from '../methods/common';
import { getTokenAmount, getTokenUSDAmount } from './token-amounts';

jest.mock('../methods/common', () => ({
  getAmount: jest.fn(),
  getUsdAmount: jest.fn(),
}));

const mockedGetAmount = getAmount as jest.MockedFunction<typeof getAmount>;
const mockedGetUsdAmount = getUsdAmount as jest.MockedFunction<
  typeof getUsdAmount
>;

describe('notification-states/token-amounts', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('getTokenAmount formats "<ellipsed amount> <symbol>"', () => {
    mockedGetAmount.mockReturnValue('1.23');
    expect(
      getTokenAmount({ amount: '123', decimals: '2', symbol: 'USDC' }),
    ).toBe('1.23 USDC');
    expect(mockedGetAmount).toHaveBeenCalledWith('123', '2', {
      shouldEllipse: true,
    });
  });

  it('getTokenUSDAmount prefixes $ to the USD conversion', () => {
    mockedGetUsdAmount.mockReturnValue('123.45');
    expect(
      getTokenUSDAmount({ amount: '1', decimals: '2', usd: '3' }),
    ).toBe('$123.45');
    expect(mockedGetUsdAmount).toHaveBeenCalledWith('1', '2', '3');
  });
});
