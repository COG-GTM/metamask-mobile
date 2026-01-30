import { hasProperty, isObject } from '@metamask/utils';
import { captureException } from '@sentry/react-native';
import { toHex } from '@metamask/controller-utils';
import { isHexString } from 'ethereumjs-util';

/**
 * Legacy TokenListController state structure at the time of migration 31.
 * This interface represents the state shape that users may have stored on their devices.
 */
interface LegacyTokenListControllerState {
  tokensChainsCache: Record<string, unknown>;
}

/**
 * Legacy TokenRatesController state structure at the time of migration 31.
 * The contractExchangeRatesByChainId property existed in older versions of the controller.
 */
interface LegacyTokenRatesControllerState {
  contractExchangeRatesByChainId?: Record<string, Record<string, unknown>>;
}

/**
 * Legacy TokensController state structure at the time of migration 31.
 * These properties represent the token storage format that needed chain ID migration.
 * Each property is optional since they are validated separately in the migration.
 */
interface LegacyTokensControllerState {
  allTokens?: Record<string, Record<string, unknown>>;
  allIgnoredTokens?: Record<string, Record<string, unknown>>;
  allDetectedTokens?: Record<string, Record<string, unknown>>;
}

/**
 * This migration is to address the users that were impacted by the tokens missing on their wallet
 * Because the chain id was not migrated to hexadecimal format
 * And still didn't import the tokens again
 * @param state
 * @returns
 */
export default async function migrate(stateAsync: unknown) {
  const state = await stateAsync;

  if (!isObject(state)) {
    captureException(
      new Error(`Migration 31: Invalid state: '${typeof state}'`),
    );
    // Force vault corruption if state is completely corrupt
    return {};
  }

  if (!isObject(state.engine)) {
    captureException(
      new Error(`Migration 31: Invalid engine state: '${typeof state.engine}'`),
    );
    // Force vault corruption if state is completely corrupt
    const { engine, ...restState } = state;
    return restState;
  }

  if (!isObject(state.engine.backgroundState)) {
    captureException(
      new Error(
        `Migration 31: Invalid engine backgroundState: '${typeof state.engine
          .backgroundState}'`,
      ),
    );
    const { engine, ...restState } = state;
    return restState;
  }

  const tokenListControllerState =
    state?.engine?.backgroundState?.TokenListController;
  const newTokenListControllerState = state?.engine?.backgroundState
    ?.TokenListController as LegacyTokenListControllerState;

  if (!isObject(tokenListControllerState)) {
    captureException(
      new Error(
        `Migration 31: Invalid TokenListController state: '${JSON.stringify(
          tokenListControllerState,
        )}'`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(tokenListControllerState, 'tokensChainsCache') ||
    !isObject(tokenListControllerState.tokensChainsCache)
  ) {
    captureException(
      new Error(
        `Migration 31: Invalid tokenListControllerState tokensChainsCache: '${JSON.stringify(
          tokenListControllerState.tokensChainsCache,
        )}'`,
      ),
    );
    return state;
  }

  if (Object.keys(tokenListControllerState.tokensChainsCache).length) {
    Object.keys(tokenListControllerState.tokensChainsCache).forEach(
      (chainId) => {
        if (!isHexString(chainId)) {
          const hexChainId = toHex(chainId);

          if (
            !Object.prototype.hasOwnProperty.call(
              newTokenListControllerState.tokensChainsCache,
              hexChainId,
            )
          ) {
            const legacyTokenListState =
              tokenListControllerState as LegacyTokenListControllerState;
            newTokenListControllerState.tokensChainsCache[hexChainId] =
              legacyTokenListState.tokensChainsCache[chainId];
          }

          if (isObject(tokenListControllerState.tokensChainsCache)) {
            delete tokenListControllerState.tokensChainsCache[chainId];
          }
        }
      },
    );
  }

  const tokenRatesControllerState =
    state?.engine?.backgroundState?.TokenRatesController;
  const newTokenRatesControllerState = state?.engine?.backgroundState
    ?.TokenRatesController as LegacyTokenRatesControllerState;

  if (!isObject(tokenRatesControllerState)) {
    captureException(
      new Error(
        `Migration 31: Invalid TokenRatesController state: '${JSON.stringify(
          tokenRatesControllerState,
        )}'`,
      ),
    );
    return state;
  }

  if (
    isObject(tokenRatesControllerState.contractExchangeRatesByChainId) &&
    Object.keys(tokenRatesControllerState.contractExchangeRatesByChainId).length
  ) {
    Object.keys(
      tokenRatesControllerState.contractExchangeRatesByChainId,
    ).forEach((chainId) => {
      if (!isHexString(chainId)) {
        const hexChainId = toHex(chainId);

        const legacyTokenRatesState =
          tokenRatesControllerState as LegacyTokenRatesControllerState;
        if (
          newTokenRatesControllerState.contractExchangeRatesByChainId &&
          !Object.prototype.hasOwnProperty.call(
            newTokenRatesControllerState.contractExchangeRatesByChainId,
            hexChainId,
          ) &&
          legacyTokenRatesState.contractExchangeRatesByChainId
        ) {
          newTokenRatesControllerState.contractExchangeRatesByChainId[
            hexChainId
          ] = legacyTokenRatesState.contractExchangeRatesByChainId[chainId];
        }

        if (
          isObject(tokenRatesControllerState.contractExchangeRatesByChainId)
        ) {
          delete tokenRatesControllerState.contractExchangeRatesByChainId[
            chainId
          ];
        }
      }
    });
  }

  const tokensControllerState =
    state?.engine?.backgroundState?.TokensController;
  const newTokensControllerState = state?.engine?.backgroundState
    ?.TokensController as LegacyTokensControllerState;

  if (!isObject(tokensControllerState)) {
    captureException(
      new Error(
        `Migration 31: Invalid TokensController state: '${JSON.stringify(
          tokensControllerState,
        )}'`,
      ),
    );
    return state;
  }

  if (
    !hasProperty(tokensControllerState, 'allTokens') ||
    !isObject(tokensControllerState.allTokens)
  ) {
    captureException(
      new Error(
        `Migration 31: Invalid TokensController allTokens: '${JSON.stringify(
          tokensControllerState.allTokens,
        )}'`,
      ),
    );
    return state;
  }

  if (Object.keys(tokensControllerState.allTokens).length) {
    Object.keys(tokensControllerState.allTokens).forEach((chainId) => {
      if (!isHexString(chainId)) {
        const hexChainId = toHex(chainId);
        if (
          newTokensControllerState.allTokens &&
          !Object.prototype.hasOwnProperty.call(
            newTokensControllerState.allTokens,
            hexChainId,
          )
        ) {
          const legacyTokensState =
            tokensControllerState as LegacyTokensControllerState;
          if (legacyTokensState.allTokens) {
            newTokensControllerState.allTokens[hexChainId] =
              legacyTokensState.allTokens[chainId];
          }
        }
        if (isObject(tokensControllerState.allTokens)) {
          delete tokensControllerState.allTokens[chainId];
        }
      }
    });
  }

  if (
    !hasProperty(tokensControllerState, 'allIgnoredTokens') ||
    !isObject(tokensControllerState.allIgnoredTokens)
  ) {
    captureException(
      new Error(
        `Migration 31: Invalid TokensController allIgnoredTokens: '${JSON.stringify(
          tokensControllerState.allIgnoredTokens,
        )}'`,
      ),
    );
    return state;
  }

  if (Object.keys(tokensControllerState.allIgnoredTokens).length) {
    Object.keys(tokensControllerState.allIgnoredTokens).forEach((chainId) => {
      if (!isHexString(chainId)) {
        const hexChainId = toHex(chainId);
        if (
          newTokensControllerState.allIgnoredTokens &&
          !Object.prototype.hasOwnProperty.call(
            newTokensControllerState.allIgnoredTokens,
            hexChainId,
          )
        ) {
          const legacyTokensState =
            tokensControllerState as LegacyTokensControllerState;
          if (legacyTokensState.allIgnoredTokens) {
            newTokensControllerState.allIgnoredTokens[hexChainId] =
              legacyTokensState.allIgnoredTokens[chainId];
          }
        }
        if (isObject(tokensControllerState.allIgnoredTokens)) {
          delete tokensControllerState.allIgnoredTokens[chainId];
        }
      }
    });
  }

  if (
    !hasProperty(tokensControllerState, 'allDetectedTokens') ||
    !isObject(tokensControllerState.allDetectedTokens)
  ) {
    captureException(
      new Error(
        `Migration 31: Invalid TokensController allDetectedTokens: '${JSON.stringify(
          tokensControllerState.allDetectedTokens,
        )}'`,
      ),
    );
    return state;
  }

  if (Object.keys(tokensControllerState.allDetectedTokens).length) {
    Object.keys(tokensControllerState.allDetectedTokens).forEach((chainId) => {
      if (!isHexString(chainId)) {
        const hexChainId = toHex(chainId);
        if (
          newTokensControllerState.allDetectedTokens &&
          !Object.prototype.hasOwnProperty.call(
            newTokensControllerState.allDetectedTokens,
            hexChainId,
          )
        ) {
          const legacyTokensState =
            tokensControllerState as LegacyTokensControllerState;
          if (legacyTokensState.allDetectedTokens) {
            newTokensControllerState.allDetectedTokens[hexChainId] =
              legacyTokensState.allDetectedTokens[chainId];
          }
        }
        if (isObject(tokensControllerState.allDetectedTokens)) {
          delete tokensControllerState.allDetectedTokens[chainId];
        }
      }
    });
  }

  return state;
}
