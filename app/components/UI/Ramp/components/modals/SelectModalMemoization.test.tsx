import React from 'react';
import { CryptoCurrency, FiatCurrency } from '@consensys/on-ramp-sdk';
import renderWithProvider from '../../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../../util/test/initial-root-state';
import FiatSelectModal from './FiatSelectModal';
import TokenSelectModal from '../TokenSelectModal';

const mockFuseConstructor = jest.fn();
jest.mock('fuse.js', () => {
  const ActualFuse = jest.requireActual('fuse.js');
  return jest.fn().mockImplementation((...args) => {
    mockFuseConstructor(...args);
    return new ActualFuse(...args);
  });
});

const state = { engine: { backgroundState } };

const currencies = [
  { id: '/currencies/fiat/usd', symbol: 'USD', name: 'US Dollar' },
  { id: '/currencies/fiat/eur', symbol: 'EUR', name: 'Euro' },
] as unknown as FiatCurrency[];

const tokens = [
  {
    address: '0x0000000000000000000000000000000000000001',
    symbol: 'AAA',
    name: 'Token A',
    network: { shortName: 'Ethereum' },
  },
] as unknown as CryptoCurrency[];

describe('Ramp select modals memoization', () => {
  beforeEach(() => {
    mockFuseConstructor.mockClear();
  });

  it('FiatSelectModal does not rebuild Fuse on re-render without excludeIds', () => {
    const props = {
      isVisible: false,
      dismiss: jest.fn(),
      onItemPress: jest.fn(),
      currencies,
    };
    const { rerender } = renderWithProvider(<FiatSelectModal {...props} />, {
      state,
    });
    rerender(<FiatSelectModal {...props} />);
    rerender(<FiatSelectModal {...props} />);
    expect(mockFuseConstructor).toHaveBeenCalledTimes(1);
  });

  it('FiatSelectModal still filters excluded ids', () => {
    renderWithProvider(
      <FiatSelectModal
        isVisible={false}
        dismiss={jest.fn()}
        onItemPress={jest.fn()}
        currencies={currencies}
        excludeIds={['/CURRENCIES/FIAT/USD']}
      />,
      { state },
    );
    expect(mockFuseConstructor).toHaveBeenCalledWith(
      [currencies[1]],
      expect.anything(),
    );
  });

  it('TokenSelectModal does not rebuild Fuse on re-render without excludeAddresses', () => {
    const props = {
      isVisible: false,
      dismiss: jest.fn(),
      onItemPress: jest.fn(),
      tokens,
    };
    const { rerender } = renderWithProvider(<TokenSelectModal {...props} />, {
      state,
    });
    rerender(<TokenSelectModal {...props} />);
    rerender(<TokenSelectModal {...props} />);
    expect(mockFuseConstructor).toHaveBeenCalledTimes(1);
  });
});
