import React from 'react';
import { screen } from '@testing-library/react-native';
import Fuse from 'fuse.js';
import { CryptoCurrency } from '@consensys/on-ramp-sdk';
import TokenSelectModal from './TokenSelectModal';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';

jest.mock('fuse.js', () => jest.fn());

jest.mock('react-native-modal', () => ({
  __esModule: true,
  default: ({
    isVisible,
    children,
  }: {
    isVisible: boolean;
    children: React.ReactNode;
  }) => (isVisible ? children : null),
}));

const ActualFuse = jest.requireActual('fuse.js');
const mockFuse = Fuse as unknown as jest.Mock;

const defaultState = {
  engine: {
    backgroundState,
  },
};

const createToken = (symbol: string, address: string) =>
  ({
    id: `token-${symbol}`,
    idv2: `token-${symbol}`,
    network: { chainId: '1', shortName: 'Ethereum' },
    symbol,
    logo: `https://example.com/${symbol}.png`,
    decimals: 18,
    address,
    name: `${symbol} token`,
    limits: ['0.001', '8'],
  } as unknown as CryptoCurrency);

const tokens = [
  createToken('ETH', '0x0000000000000000000000000000000000000000'),
  createToken('USDC', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
];

const renderModal = (
  props: Partial<React.ComponentProps<typeof TokenSelectModal>> = {},
) => {
  const buildElement = (
    overrides: Partial<React.ComponentProps<typeof TokenSelectModal>> = {},
  ) => (
    <TokenSelectModal
      isVisible={false}
      dismiss={jest.fn()}
      tokens={tokens}
      onItemPress={jest.fn()}
      {...props}
      {...overrides}
    />
  );
  const result = renderWithProvider(buildElement(), { state: defaultState });
  return {
    ...result,
    rerenderModal: (
      overrides: Partial<React.ComponentProps<typeof TokenSelectModal>> = {},
    ) => result.rerender(buildElement(overrides)),
  };
};

describe('TokenSelectModal', () => {
  beforeEach(() => {
    mockFuse.mockClear();
    mockFuse.mockImplementation(
      (...args: unknown[]) => new ActualFuse(...args),
    );
  });

  it('does not rebuild the search index on re-render when excludeAddresses is omitted', () => {
    const { rerenderModal } = renderModal();
    expect(mockFuse).toHaveBeenCalledTimes(1);

    rerenderModal();
    rerenderModal({ title: 'Another title' });

    expect(mockFuse).toHaveBeenCalledTimes(1);
  });

  it('rebuilds the search index when the tokens change', () => {
    const { rerenderModal } = renderModal();
    expect(mockFuse).toHaveBeenCalledTimes(1);

    rerenderModal({ tokens: [tokens[0]] });

    expect(mockFuse).toHaveBeenCalledTimes(2);
    expect(mockFuse.mock.calls[1][0]).toEqual([tokens[0]]);
  });

  it('excludes tokens whose address is in excludeAddresses (case-insensitive)', () => {
    renderModal({
      isVisible: true,
      excludeAddresses: [tokens[1].address.toLowerCase()],
    });

    expect(mockFuse.mock.calls[0][0]).toEqual([tokens[0]]);
    expect(screen.getByText('ETH')).toBeTruthy();
    expect(screen.queryByText('USDC')).toBeNull();
  });

  it('lists every token when excludeAddresses is omitted', () => {
    renderModal({ isVisible: true });

    expect(screen.getByText('ETH')).toBeTruthy();
    expect(screen.getByText('USDC')).toBeTruthy();
  });
});
