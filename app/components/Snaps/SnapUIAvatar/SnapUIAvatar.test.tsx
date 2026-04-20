import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { SnapUIAvatar, DIAMETERS } from './SnapUIAvatar';

describe('SnapUIAvatar', () => {
  const ethAddress = 'eip155:1:0xabcd5d886577d5081b0c52e242ef29e70be3e7bc';
  const solanaAddress =
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:4Nd1mFyF9tQ67GnKd4gN8rZv2nA7eKjXvWqJw2yKm7bT';

  it('renders a Jazzicon by default (EIP-155 namespace)', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAvatar address={ethAddress} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders a Blockie image when useBlockieIcon is enabled', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAvatar address={ethAddress} />,
      { state: { settings: { useBlockieIcon: true } } },
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain('data:image/png;base64');
  });

  it('honours the size prop via the DIAMETERS map', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAvatar address={ethAddress} size="lg" />,
      { state: { settings: { useBlockieIcon: true } } },
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).toContain(`"width":${DIAMETERS.lg}`);
    expect(tree).toContain(`"height":${DIAMETERS.lg}`);
  });

  it('handles non-EIP155 CAIP namespaces', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAvatar address={solanaAddress} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('matches the snapshot for the default size and blockie off', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAvatar address={ethAddress} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
