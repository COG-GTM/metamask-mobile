import { CHAIN_IDS } from '@metamask/transaction-controller';
import { useFocusEffect } from '@react-navigation/native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import React from 'react';
import Routes from '../../../../../../../constants/navigation/Routes';
import { MetricsEventBuilder } from '../../../../../../../core/Analytics/MetricsEventBuilder';
import Engine from '../../../../../../../core/Engine';
import {
  selectConfirmationRedesignFlags,
  type ConfirmationRedesignRemoteFlags,
} from '../../../../../../../selectors/featureFlagController/confirmations';
import { createMockAccountsControllerState } from '../../../../../../../util/test/accountsControllerTestUtils';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';
import { mockNetworkState } from '../../../../../../../util/test/network';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import { MOCK_POOL_STAKING_SDK } from '../../../../__mocks__/mockData';
import useStakingChain from '../../../../hooks/useStakingChain';
import {
  MetaMetricsEvents,
  useMetrics,
} from '../../../../../../hooks/useMetrics';
import { EVENT_LOCATIONS } from '../../../../constants/events';
import ClaimBanner from './ClaimBanner';

const MOCK_CLAIM_AMOUNT = '16000000000000000';
const MOCK_ADDRESS_1 = '0x0123456789abcdef0123456789abcdef01234567';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS_1,
]);

const mockInitialState = {
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

jest.mock('../../../../../../../core/Engine', () => ({
  controllerMessenger: {
    subscribeOnceIf: jest.fn(),
  },
  context: {
    NetworkController: {
      setActiveNetwork: jest.fn(),
    },
    MultichainNetworkController: {
      setActiveNetwork: jest.fn(),
    },
  },
}));

jest.mock('../../../../../../hooks/useMetrics');

const mockTrackEvent = jest.fn();

jest.mock(
  '../../../../../../../selectors/featureFlagController/confirmations',
  () => ({
    ...jest.requireActual(
      '../../../../../../../selectors/featureFlagController/confirmations',
    ),
    selectConfirmationRedesignFlags: jest.fn(),
  }),
);

jest.mock('../../../../hooks/useStakeContext', () => ({
  __esModule: true,
  useStakeContext: jest.fn(() => MOCK_POOL_STAKING_SDK),
}));

jest.mock('../../../../hooks/useStakingChain', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isStakingSupportedChain: true,
  })),
}));

const mockAttemptPoolStakedClaimTransaction = jest.fn();

jest.mock('../../../../hooks/usePoolStakedClaim', () => ({
  __esModule: true,
  default: () => ({
    attemptPoolStakedClaimTransaction: mockAttemptPoolStakedClaimTransaction,
  }),
}));

const mockNavigate = jest.fn();
const noop = () => undefined;

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    addListener: jest.fn().mockReturnValue(noop),
  }),
  useFocusEffect: jest.fn(),
}));

describe('ClaimBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    (useStakingChain as jest.Mock).mockReturnValue({
      isStakingSupportedChain: true,
    });
    (useFocusEffect as jest.Mock).mockImplementation(jest.fn());
    (useMetrics as jest.MockedFn<typeof useMetrics>).mockReturnValue({
      trackEvent: mockTrackEvent,
      createEventBuilder: MetricsEventBuilder.createEventBuilder,
    } as unknown as ReturnType<typeof useMetrics>);
    jest.mocked(selectConfirmationRedesignFlags).mockReturnValue({
      staking_confirmations: false,
    } as ConfirmationRedesignRemoteFlags);
  });

  it('render matches snapshot', () => {
    const { toJSON } = renderWithProvider(
      <ClaimBanner claimableAmount={MOCK_CLAIM_AMOUNT} />,
      { state: mockInitialState },
    );

    expect(toJSON()).toMatchSnapshot();
  });

  it('claim button switches to mainnet on press if on unsupported chain', async () => {
    (useStakingChain as jest.Mock).mockReturnValue({
      isStakingSupportedChain: false,
    });
    const { getByTestId } = renderWithProvider(
      <ClaimBanner claimableAmount={MOCK_CLAIM_AMOUNT} />,
      {
        state: {
          ...mockInitialState,
          engine: {
            ...mockInitialState.engine,
            backgroundState: {
              ...mockInitialState.engine.backgroundState,
              NetworkController: {
                ...mockNetworkState({
                  chainId: CHAIN_IDS.SEPOLIA,
                  id: 'sepolia',
                  nickname: 'Sepolia',
                  ticker: 'ETH',
                }),
              },
            },
          },
        },
      },
    );

    const claimButton = getByTestId('claim-banner-claim-eth-button');

    fireEvent.press(claimButton);

    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).toHaveBeenCalledWith('mainnet');
  });

  it('claim button is disabled on subsequent presses', async () => {
    const { getByTestId } = renderWithProvider(
      <ClaimBanner claimableAmount={MOCK_CLAIM_AMOUNT} />,
      { state: mockInitialState },
    );

    const claimButton = getByTestId('claim-banner-claim-eth-button');

    fireEvent.press(claimButton);

    expect(claimButton.props.disabled).toBe(true);
    expect(
      Engine.context.MultichainNetworkController.setActiveNetwork,
    ).not.toHaveBeenCalled();
    expect(mockAttemptPoolStakedClaimTransaction).toHaveBeenCalledTimes(1);
  });
  describe('claim flow on a supported chain', () => {
    const MOCK_TRANSACTION_ID = '1';
    const subscribeOnceIfMock = jest.mocked(
      Engine.controllerMessenger.subscribeOnceIf,
    );

    const getSubscription = (eventName: string) => {
      const call = subscribeOnceIfMock.mock.calls.find(
        ([event]) => event === eventName,
      );
      if (!call) throw new Error(`No subscription for ${eventName}`);
      const [, handler, predicate] = call as unknown as [
        string,
        () => void,
        (payload: unknown) => boolean,
      ];
      return { handler, predicate };
    };

    const pressClaim = () => {
      const utils = renderWithProvider(
        <ClaimBanner claimableAmount={MOCK_CLAIM_AMOUNT} />,
        { state: mockInitialState },
      );
      fireEvent.press(utils.getByTestId('claim-banner-claim-eth-button'));
      return utils;
    };

    beforeEach(() => {
      mockAttemptPoolStakedClaimTransaction.mockResolvedValue({
        transactionMeta: { id: MOCK_TRANSACTION_ID },
      });
    });

    it('tracks STAKE_CLAIM_BUTTON_CLICKED and attempts the claim for the selected account', async () => {
      pressClaim();

      await waitFor(() => expect(subscribeOnceIfMock).toHaveBeenCalledTimes(3));

      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
      expect(mockTrackEvent).toHaveBeenCalledWith(
        MetricsEventBuilder.createEventBuilder(
          MetaMetricsEvents.STAKE_CLAIM_BUTTON_CLICKED,
        )
          .addProperties({ location: EVENT_LOCATIONS.TOKEN_DETAILS })
          .build(),
      );
      expect(mockAttemptPoolStakedClaimTransaction).toHaveBeenCalledTimes(1);
      expect(mockAttemptPoolStakedClaimTransaction.mock.calls[0][0]).toBe(
        MOCK_ADDRESS_1,
      );
    });

    it('subscribes to confirmed, failed and rejected events and does not navigate when redesign flag is off', async () => {
      pressClaim();

      await waitFor(() => expect(subscribeOnceIfMock).toHaveBeenCalledTimes(3));

      expect(subscribeOnceIfMock.mock.calls.map(([event]) => event)).toEqual([
        'TransactionController:transactionConfirmed',
        'TransactionController:transactionFailed',
        'TransactionController:transactionRejected',
      ]);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('subscription predicates only match the claim transaction id', async () => {
      pressClaim();

      await waitFor(() => expect(subscribeOnceIfMock).toHaveBeenCalledTimes(3));

      const confirmed = getSubscription(
        'TransactionController:transactionConfirmed',
      );
      expect(confirmed.predicate({ id: MOCK_TRANSACTION_ID })).toBe(true);
      expect(confirmed.predicate({ id: '2' })).toBe(false);

      for (const event of [
        'TransactionController:transactionFailed',
        'TransactionController:transactionRejected',
      ]) {
        const { predicate } = getSubscription(event);
        expect(
          predicate({ transactionMeta: { id: MOCK_TRANSACTION_ID } }),
        ).toBe(true);
        expect(predicate({ transactionMeta: { id: '2' } })).toBe(false);
      }
    });

    it.each([
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionFailed',
      'TransactionController:transactionRejected',
    ])('re-enables the claim button when %s fires', async (eventName) => {
      const { getByTestId } = pressClaim();

      await waitFor(() => expect(subscribeOnceIfMock).toHaveBeenCalledTimes(3));
      expect(getByTestId('claim-banner-claim-eth-button').props.disabled).toBe(
        true,
      );

      act(() => {
        getSubscription(eventName).handler();
      });

      expect(getByTestId('claim-banner-claim-eth-button').props.disabled).toBe(
        false,
      );
    });

    it('re-enables the claim button and skips subscriptions when the claim attempt rejects', async () => {
      mockAttemptPoolStakedClaimTransaction.mockRejectedValue(
        new Error('claim failed'),
      );
      const { getByTestId } = pressClaim();

      await waitFor(() =>
        expect(
          getByTestId('claim-banner-claim-eth-button').props.disabled,
        ).toBe(false),
      );
      expect(mockAttemptPoolStakedClaimTransaction).toHaveBeenCalledTimes(1);
      expect(subscribeOnceIfMock).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('navigates to the redesigned stake claim confirmation with amountWei when redesign flag is on', async () => {
      jest.mocked(selectConfirmationRedesignFlags).mockReturnValue({
        staking_confirmations: true,
      } as ConfirmationRedesignRemoteFlags);

      pressClaim();

      await waitFor(() => expect(mockNavigate).toHaveBeenCalledTimes(1));

      expect(mockAttemptPoolStakedClaimTransaction).toHaveBeenCalledTimes(1);
      expect(mockAttemptPoolStakedClaimTransaction.mock.calls[0][0]).toBe(
        MOCK_ADDRESS_1,
      );
      expect(mockNavigate).toHaveBeenCalledWith('StakeScreens', {
        screen: Routes.STANDALONE_CONFIRMATIONS.STAKE_CLAIM,
        params: { amountWei: MOCK_CLAIM_AMOUNT },
      });
      expect(subscribeOnceIfMock).not.toHaveBeenCalled();
    });

    it('does not navigate when the redesigned claim attempt rejects', async () => {
      jest.mocked(selectConfirmationRedesignFlags).mockReturnValue({
        staking_confirmations: true,
      } as ConfirmationRedesignRemoteFlags);
      mockAttemptPoolStakedClaimTransaction.mockRejectedValue(
        new Error('claim failed'),
      );

      const { getByTestId } = pressClaim();

      await waitFor(() =>
        expect(
          getByTestId('claim-banner-claim-eth-button').props.disabled,
        ).toBe(false),
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
