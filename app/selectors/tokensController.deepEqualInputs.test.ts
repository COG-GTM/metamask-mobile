import { isEqual } from 'lodash';
import { RootState } from '../reducers';
import {
  selectAllTokens,
  selectTokens,
  selectTokensByChainIdAndAddress,
} from './tokensController';

jest.mock('lodash', () => {
  const actual = jest.requireActual('lodash');
  return { ...actual, isEqual: jest.fn(actual.isEqual) };
});

const mockIsEqual = isEqual as unknown as jest.Mock;

const token = { address: '0xToken1', symbol: 'TOKEN1', decimals: 18 };

const buildState = (tokensController: Record<string, unknown>): RootState =>
  ({
    engine: {
      backgroundState: {
        TokensController: tokensController,
        NetworkController: {
          selectedNetworkClientId: 'mainnet',
          networkConfigurationsByChainId: {
            '0x1': {
              chainId: '0x1',
              rpcEndpoints: [{ networkClientId: 'mainnet' }],
              defaultRpcEndpointIndex: 0,
            },
          },
        },
        AccountsController: {
          internalAccounts: {
            selectedAccount: 'account1',
            accounts: { account1: { address: '0xAddress1' } },
          },
        },
      },
    },
  } as unknown as RootState);

const isControllerState = (value: unknown) =>
  typeof value === 'object' &&
  value !== null &&
  ('allDetectedTokens' in value || 'allIgnoredTokens' in value);

describe('TokensController deep-equal selector inputs', () => {
  it.each([
    ['selectTokens', selectTokens],
    ['selectTokensByChainIdAndAddress', selectTokensByChainIdAndAddress],
    ['selectAllTokens', selectAllTokens],
  ])(
    '%s never deep-compares the whole TokensController state',
    (_name, selector) => {
      const allTokens = { '0x1': { '0xAddress1': [token] } };
      selector(
        buildState({ allTokens, allIgnoredTokens: {}, allDetectedTokens: {} }),
      );
      mockIsEqual.mockClear();

      const second = buildState({
        allTokens,
        allIgnoredTokens: { '0x1': { '0xAddress1': ['0xIgnored'] } },
        allDetectedTokens: { '0x1': { '0xAddress1': [token] } },
      });
      selector(second);

      const controllerStateCompares = mockIsEqual.mock.calls.filter(
        ([a, b]) => isControllerState(a) || isControllerState(b),
      );
      expect(controllerStateCompares).toHaveLength(0);
    },
  );

  it('keeps the selectTokens reference when only detected or ignored tokens change', () => {
    const allTokens = { '0x1': { '0xAddress1': [token] } };
    const first = selectTokens(
      buildState({ allTokens, allIgnoredTokens: {}, allDetectedTokens: {} }),
    );
    const second = selectTokens(
      buildState({
        allTokens,
        allIgnoredTokens: {},
        allDetectedTokens: { '0x1': { '0xAddress1': [token] } },
      }),
    );
    expect(second).toBe(first);
  });

  it('keeps the selectTokens reference when the slice is a new array with equal content', () => {
    const first = selectTokens(
      buildState({
        allTokens: { '0x1': { '0xAddress1': [{ ...token }] } },
        allIgnoredTokens: {},
        allDetectedTokens: {},
      }),
    );
    const second = selectTokens(
      buildState({
        allTokens: { '0x1': { '0xAddress1': [{ ...token }] } },
        allIgnoredTokens: {},
        allDetectedTokens: {},
      }),
    );
    expect(second).toBe(first);
  });
});
