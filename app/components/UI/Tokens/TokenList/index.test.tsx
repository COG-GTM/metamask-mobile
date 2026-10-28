import React from 'react';
import { TokenList, FlashListAssetKey } from '.';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import { backgroundState } from '../../../../util/test/initial-root-state';
import { useEarnTokenKeys } from '../../Earn/hooks/useEarnTokens';

const mockEarnTokenKeys = new Set(['0x1:USDC']);
const mockTokenListItem = jest.fn();

jest.mock('../../Earn/hooks/useEarnTokens', () => ({
  __esModule: true,
  default: jest.fn(() => []),
  useEarnTokenKeys: jest.fn(() => mockEarnTokenKeys),
}));

jest.mock('./TokenListItem', () => ({
  TokenListItem: (props: { earnTokenKeys: ReadonlySet<string> }) => {
    mockTokenListItem(props);
    return null;
  },
}));

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn() }),
}));

const tokenKeys: FlashListAssetKey[] = [
  { address: '0x0', chainId: '0x1', isStaked: false },
  { address: '0xa0b8', chainId: '0x1', isStaked: false },
  { address: '0x0', chainId: '0x1', isStaked: true },
  { address: '0xdac1', chainId: '0x1', isStaked: false },
];

describe('TokenList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('derives earn token keys once for the list and passes them to every row', () => {
    renderWithProvider(
      <TokenList
        tokenKeys={tokenKeys}
        refreshing={false}
        isAddTokenEnabled
        onRefresh={jest.fn()}
        showRemoveMenu={jest.fn()}
        goToAddToken={jest.fn()}
        setShowScamWarningModal={jest.fn()}
      />,
      { state: { engine: { backgroundState } } },
    );

    const renderedRows = mockTokenListItem.mock.calls.length;
    expect(renderedRows).toBeGreaterThanOrEqual(tokenKeys.length);
    expect(useEarnTokenKeys).toHaveBeenCalledTimes(1);
    mockTokenListItem.mock.calls.forEach(([props]) => {
      expect(props.earnTokenKeys).toBe(mockEarnTokenKeys);
    });
  });
});
