

import {
  selectPrimaryCurrency,
  selectShowCustomNonce,
  selectShowFiatInTestnets } from
'./settings';

describe('selectShowFiatInTestnets', () => {
  it('returns showFiatOnTestnets from state', () => {
    const mockState = {
      settings: {
        showFiatOnTestnets: true
      }
    };

    expect(selectShowFiatInTestnets(mockState)).toBe(true);
  });
});

describe('selectPrimaryCurrency', () => {
  it('returns primaryCurrency from state', () => {
    const mockState = {
      settings: {
        primaryCurrency: 'USD'
      }
    };

    expect(selectPrimaryCurrency(mockState)).toBe('USD');
  });
});

describe('selectShowCustomNonce', () => {
  it('returns showCustomNonce from state', () => {
    const mockState = {
      settings: {
        showCustomNonce: false
      }
    };

    expect(selectShowCustomNonce(mockState)).toBe(false);
  });
});