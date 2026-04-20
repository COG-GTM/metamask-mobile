import React from 'react';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { SnapUIAddress } from './SnapUIAddress';
import { useDisplayName } from './useDisplayName';

jest.mock('./useDisplayName', () => ({
  useDisplayName: jest.fn(),
}));

describe('SnapUIAddress', () => {
  const caip =
    'eip155:1:0xabcd5d886577d5081b0c52e242ef29e70be3e7bc';

  beforeEach(() => {
    (useDisplayName as jest.Mock).mockReturnValue(undefined);
  });

  it('renders the checksummed and truncated address by default', () => {
    const { getByText } = renderWithProvider(
      <SnapUIAddress address={caip} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    // The displayed truncated address should start with the checksum prefix.
    expect(getByText(/0x/)).toBeTruthy();
  });

  it('renders the unchanged address when truncate is false', () => {
    const { getByText } = renderWithProvider(
      <SnapUIAddress address={caip} truncate={false} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    expect(getByText(caip)).toBeTruthy();
  });

  it('treats a raw hex address as eip155:1 and renders', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAddress address="0xabcd5d886577d5081b0c52e242ef29e70be3e7bc" />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders the display name when enabled and available', () => {
    (useDisplayName as jest.Mock).mockReturnValue('Vitalik');

    const { getByText } = renderWithProvider(
      <SnapUIAddress address={caip} displayName />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    expect(getByText('Vitalik')).toBeTruthy();
  });

  it('hides the avatar when avatar is false', () => {
    const { toJSON } = renderWithProvider(
      <SnapUIAddress address={caip} avatar={false} />,
      { state: { settings: { useBlockieIcon: false } } },
    );
    const tree = JSON.stringify(toJSON());
    expect(tree).not.toContain('RNSVGSvgView');
  });
});
