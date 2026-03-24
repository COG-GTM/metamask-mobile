import React from 'react';
import { render } from '@testing-library/react-native';
import EthereumAddress from './';

jest.mock('../../../../wdio/utils/generateTestId', () => ({
  __esModule: true,
  default: (_platform: unknown, id: string) => ({ testID: id }),
}));

jest.mock(
  '../../../../wdio/screen-objects/testIDs/Screens/WalletView.testIds',
  () => ({
    WALLET_ACCOUNT_ADDRESS_LABEL: 'wallet-account-address',
  }),
);

jest.mock('../../../util/address', () => ({
  formatAddress: (address: string, type: string) => {
    if (!address) return '';
    if (type === 'short') {
      return `${address.slice(0, 5)}...${address.slice(-4)}`;
    }
    if (type === 'mid') {
      return `${address.slice(0, 7)}...${address.slice(-5)}`;
    }
    return address;
  },
}));

const MOCK_ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

describe('EthereumAddress', () => {
  it('renders without crashing', () => {
    const { toJSON } = render(<EthereumAddress />);
    expect(toJSON()).not.toBeNull();
  });

  it('renders the full Ethereum address by default', () => {
    const { getByText } = render(
      <EthereumAddress address={MOCK_ADDRESS} />,
    );
    expect(getByText(MOCK_ADDRESS)).toBeDefined();
  });

  it('renders a shortened address when type is "short"', () => {
    const { getByText } = render(
      <EthereumAddress address={MOCK_ADDRESS} type="short" />,
    );
    const expected = `${MOCK_ADDRESS.slice(0, 5)}...${MOCK_ADDRESS.slice(-4)}`;
    expect(getByText(expected)).toBeDefined();
  });

  it('renders a mid-length address when type is "mid"', () => {
    const { getByText } = render(
      <EthereumAddress address={MOCK_ADDRESS} type="mid" />,
    );
    const expected = `${MOCK_ADDRESS.slice(0, 7)}...${MOCK_ADDRESS.slice(-5)}`;
    expect(getByText(expected)).toBeDefined();
  });

  it('handles an empty address gracefully', () => {
    const { toJSON } = render(<EthereumAddress address="" />);
    expect(toJSON()).not.toBeNull();
  });

  it('handles undefined address gracefully', () => {
    const { toJSON } = render(<EthereumAddress />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('applies custom styles when provided', () => {
    const customStyle = { color: 'red', fontSize: 16 };
    const { toJSON } = render(
      <EthereumAddress address={MOCK_ADDRESS} style={customStyle} />,
    );
    const tree = toJSON();
    expect(tree).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props = (tree as any).props;
    expect(props.style).toEqual(customStyle);
  });

  it('matches snapshot with address', () => {
    const { toJSON } = render(
      <EthereumAddress address={MOCK_ADDRESS} />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('matches snapshot with short type', () => {
    const { toJSON } = render(
      <EthereumAddress address={MOCK_ADDRESS} type="short" />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
