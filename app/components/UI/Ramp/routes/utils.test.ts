import {
  createBuyNavigationDetails,
  createSellNavigationDetails,
} from './utils';
import Routes from '../../../../constants/navigation/Routes';

describe('createBuyNavigationDetails', () => {
  it('returns a tuple with only the BUY route when no intent is provided', () => {
    expect(createBuyNavigationDetails()).toEqual([Routes.RAMP.BUY]);
  });

  it('returns the BUY route with the GET_STARTED screen and params when an intent is provided', () => {
    const intent = {
      address: '0x1234',
      chainId: '1',
      amount: '100',
      currency: 'USD',
    };
    expect(createBuyNavigationDetails(intent)).toEqual([
      Routes.RAMP.BUY,
      { screen: Routes.RAMP.GET_STARTED, params: intent },
    ]);
  });
});

describe('createSellNavigationDetails', () => {
  it('returns a tuple with only the SELL route when no intent is provided', () => {
    expect(createSellNavigationDetails()).toEqual([Routes.RAMP.SELL]);
  });

  it('returns the SELL route with the GET_STARTED screen and params when an intent is provided', () => {
    const intent = {
      address: '0xabcd',
      chainId: '137',
    };
    expect(createSellNavigationDetails(intent)).toEqual([
      Routes.RAMP.SELL,
      { screen: Routes.RAMP.GET_STARTED, params: intent },
    ]);
  });
});
