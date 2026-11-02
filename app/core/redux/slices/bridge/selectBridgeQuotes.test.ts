import {
  type QuoteResponse,
  SortOrder,
  selectBridgeQuotes as selectBridgeQuotesBase,
} from '@metamask/bridge-controller';
import { GasFeeEstimates } from '@metamask/gas-fee-controller';
import { selectBridgeQuotes } from '.';
import { RootState } from '../../../../reducers';
import { createBridgeTestState } from '../../../../components/UI/Bridge/testUtils';
import mockQuotes from '../../../../components/UI/Bridge/_mocks_/mock-quotes-sol-sol.json';
import { selectGasFeeControllerEstimates } from '../../../../selectors/gasFeeController';
import { selectRemoteFeatureFlags } from '../../../../selectors/featureFlagController';
import { MetaMetrics } from '../../../Analytics';

jest.mock('@metamask/bridge-controller', () => {
  const actual = jest.requireActual('@metamask/bridge-controller');
  return {
    ...actual,
    selectBridgeQuotes: jest.fn(actual.selectBridgeQuotes),
  };
});

const mockSelectBridgeQuotesBase =
  selectBridgeQuotesBase as unknown as jest.Mock;

const buildState = (
  quotes: QuoteResponse[] = mockQuotes as unknown as QuoteResponse[],
) =>
  createBridgeTestState({
    bridgeControllerOverrides: {
      quotes,
      quotesLoadingStatus: null,
      quoteFetchError: null,
    },
  }) as unknown as RootState;

describe('selectBridgeQuotes', () => {
  beforeEach(() => {
    mockSelectBridgeQuotesBase.mockClear();
  });

  it('returns the same output as the base selector fed with the controller fields', () => {
    const state = buildState();
    const expected = jest
      .requireActual('@metamask/bridge-controller')
      .selectBridgeQuotes(
        {
          ...state.engine.backgroundState.BridgeController,
          gasFeeEstimates: selectGasFeeControllerEstimates(
            state,
          ) as GasFeeEstimates,
          ...state.engine.backgroundState.MultichainAssetsRatesController,
          ...state.engine.backgroundState.TokenRatesController,
          ...state.engine.backgroundState.CurrencyRateController,
          participateInMetaMetrics: MetaMetrics.getInstance().isEnabled(),
          remoteFeatureFlags: {
            bridgeConfig: selectRemoteFeatureFlags(state).bridgeConfig,
          },
        },
        { sortOrder: SortOrder.COST_ASC, selectedQuote: null },
      );

    const result = selectBridgeQuotes(state);

    expect(result.sortedQuotes.length).toBeGreaterThan(0);
    expect(result).toEqual(expected);
  });

  it('returns the cached reference without recomputing when unrelated state changes', () => {
    const state = buildState();
    const first = selectBridgeQuotes(state);
    const callsAfterFirst = mockSelectBridgeQuotesBase.mock.calls.length;

    const unrelatedUpdate = {
      ...state,
      settings: { ...state.settings },
      engine: {
        ...state.engine,
        backgroundState: {
          ...state.engine.backgroundState,
          PreferencesController: {
            ...state.engine.backgroundState.PreferencesController,
          },
        },
      },
    } as RootState;

    const second = selectBridgeQuotes(unrelatedUpdate);

    expect(second).toBe(first);
    expect(mockSelectBridgeQuotesBase).toHaveBeenCalledTimes(callsAfterFirst);
  });

  it('recomputes when BridgeController quotes change', () => {
    const state = buildState();
    const first = selectBridgeQuotes(state);
    const callsAfterFirst = mockSelectBridgeQuotesBase.mock.calls.length;

    const second = selectBridgeQuotes(
      buildState((mockQuotes as unknown as QuoteResponse[]).slice(0, 1)),
    );

    expect(second).not.toBe(first);
    expect(second.sortedQuotes).toHaveLength(1);
    expect(mockSelectBridgeQuotesBase).toHaveBeenCalledTimes(
      callsAfterFirst + 1,
    );
  });

  it('recomputes when token rates change', () => {
    const state = buildState();
    const first = selectBridgeQuotes(state);
    const callsAfterFirst = mockSelectBridgeQuotesBase.mock.calls.length;

    const second = selectBridgeQuotes({
      ...state,
      engine: {
        ...state.engine,
        backgroundState: {
          ...state.engine.backgroundState,
          TokenRatesController: {
            ...state.engine.backgroundState.TokenRatesController,
          },
        },
      },
    } as RootState);

    expect(second).not.toBe(first);
    expect(mockSelectBridgeQuotesBase).toHaveBeenCalledTimes(
      callsAfterFirst + 1,
    );
  });
});
