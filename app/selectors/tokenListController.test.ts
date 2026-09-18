import { merge } from 'lodash';
import { RootState } from '../reducers';
import initialRootState from '../util/test/initial-root-state';
import {
  selectTokenList,
  selectTokenListArray,
  selectERC20TokensByChain,
} from './tokenListController';

const tokenA = { address: '0xa', symbol: 'A', decimals: 18 };
const tokenB = { address: '0xb', symbol: 'B', decimals: 6 };

const buildState = (tokensChainsCache: Record<string, unknown>): RootState =>
  merge({}, initialRootState, {
    engine: {
      backgroundState: {
        TokenListController: { tokensChainsCache },
      },
    },
  });

describe('tokenListController selectors', () => {
  const state = buildState({
    '0x1': { timestamp: 1, data: { '0xa': tokenA, '0xb': tokenB } },
    '0x89': { timestamp: 2, data: { '0xc': { address: '0xc' } } },
  });

  it('selectTokenList returns the token map for the current chain', () => {
    expect(selectTokenList(state)).toEqual({ '0xa': tokenA, '0xb': tokenB });
  });

  it('selectTokenList returns an empty array when the chain is not cached', () => {
    expect(selectTokenList(buildState({}))).toEqual([]);
  });

  it('selectTokenListArray converts the token map to an array', () => {
    expect(selectTokenListArray(state)).toEqual([tokenA, tokenB]);
    expect(selectTokenListArray(buildState({}))).toEqual([]);
  });

  it('selectERC20TokensByChain returns the whole chains cache', () => {
    expect(selectERC20TokensByChain(state)).toEqual(
      state.engine.backgroundState.TokenListController.tokensChainsCache,
    );
  });
});
