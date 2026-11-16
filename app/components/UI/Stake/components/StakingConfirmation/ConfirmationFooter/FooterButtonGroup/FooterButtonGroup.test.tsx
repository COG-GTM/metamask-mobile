import React from 'react';
import renderWithProvider from '../../../../../../../util/test/renderWithProvider';
import { strings } from '../../../../../../../../locales/i18n';
import FooterButtonGroup from './FooterButtonGroup';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import {
  FooterButtonGroupActions,
  FooterButtonGroupProps,
} from './FooterButtonGroup.types';
import { createMockAccountsControllerState } from '../../../../../../../util/test/accountsControllerTestUtils';
import { backgroundState } from '../../../../../../../util/test/initial-root-state';
import { MOCK_POOL_STAKING_SDK } from '../../../../__mocks__/mockData';
import {
  MetaMetricsEvents,
  useMetrics,
} from '../../../../../../hooks/useMetrics';
import { MetricsEventBuilder } from '../../../../../../../core/Analytics/MetricsEventBuilder';
import { IMetaMetricsEvent } from '../../../../../../../core/Analytics';
import Routes from '../../../../../../../constants/navigation/Routes';
import { EVENT_LOCATIONS, EVENT_PROVIDERS } from '../../../../constants/events';

const MOCK_ADDRESS_1 = '0x0';

const MOCK_ACCOUNTS_CONTROLLER_STATE = createMockAccountsControllerState([
  MOCK_ADDRESS_1,
]);

const mockSubscribeOnceIf = jest.fn();

const mockInitialState = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

jest.mock('../../../../../../../core/Engine', () => ({
  controllerMessenger: {
    subscribeOnceIf: (...args: unknown[]) => mockSubscribeOnceIf(...args),
  },
}));

jest.mock('../../../../../../hooks/useMetrics', () => ({
  ...jest.requireActual('../../../../../../hooks/useMetrics'),
  useMetrics: jest.fn(),
}));

const mockTrackEvent = jest.fn();

const mockCanGoBack = jest.fn();
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actualReactNavigation = jest.requireActual('@react-navigation/native');
  return {
    ...actualReactNavigation,
    useNavigation: () => ({
      canGoBack: mockCanGoBack,
      goBack: mockGoBack,
      navigate: mockNavigate,
    }),
  };
});

jest.mock('../../../../hooks/useStakeContext', () => ({
  useStakeContext: () => MOCK_POOL_STAKING_SDK,
}));

const mockAttemptDepositTransaction = jest.fn();
const mockAttemptUnstakeTransaction = jest.fn();

jest.mock('../../../../hooks/usePoolStakedDeposit', () => ({
  __esModule: true,
  default: () => ({
    attemptDepositTransaction: mockAttemptDepositTransaction,
  }),
}));

jest.mock('../../../../hooks/usePoolStakedUnstake', () => ({
  __esModule: true,
  default: () => ({
    attemptUnstakeTransaction: mockAttemptUnstakeTransaction,
  }),
}));

jest.mock('../../../../hooks/usePooledStakes', () => ({
  __esModule: true,
  default: () => ({
    refreshPooledStakes: jest.fn(),
  }),
}));

describe('FooterButtonGroup', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (useMetrics as jest.MockedFn<typeof useMetrics>).mockReturnValue({
      trackEvent: mockTrackEvent,
      createEventBuilder: MetricsEventBuilder.createEventBuilder,
    } as unknown as ReturnType<typeof useMetrics>);
  });

  it('render matches snapshot', () => {
    const props: FooterButtonGroupProps = {
      valueWei: '3210000000000000',
      action: FooterButtonGroupActions.STAKE,
    };

    const { getByText, toJSON } = renderWithProvider(
      <FooterButtonGroup {...props} />,
      { state: mockInitialState },
    );

    expect(getByText(strings('stake.cancel'))).toBeDefined();
    expect(getByText(strings('stake.continue'))).toBeDefined();

    expect(toJSON()).toMatchSnapshot();
  });

  it('navigates to Asset page when cancel is pressed', () => {
    mockCanGoBack.mockImplementationOnce(() => true);
    const props: FooterButtonGroupProps = {
      valueWei: '3210000000000000',
      action: FooterButtonGroupActions.STAKE,
    };

    const { getByText, toJSON } = renderWithProvider(
      <FooterButtonGroup {...props} />,
      { state: mockInitialState },
    );

    fireEvent.press(getByText(strings('stake.cancel')));

    expect(mockGoBack).toHaveBeenCalledTimes(1);

    expect(toJSON()).toMatchSnapshot();
  });

  it('attempts stake transaction on continue click', () => {
    const props: FooterButtonGroupProps = {
      valueWei: '3210000000000000',
      action: FooterButtonGroupActions.STAKE,
    };

    const { getByText, toJSON } = renderWithProvider(
      <FooterButtonGroup {...props} />,
      { state: mockInitialState },
    );

    fireEvent.press(getByText(strings('stake.continue')));

    expect(toJSON()).toMatchSnapshot();
    expect(mockAttemptDepositTransaction).toHaveBeenCalledTimes(1);
  });

  it('attempts unstake transaction on continue click', () => {
    const props: FooterButtonGroupProps = {
      valueWei: '3210000000000000',
      action: FooterButtonGroupActions.UNSTAKE,
    };

    const { getByText, toJSON } = renderWithProvider(
      <FooterButtonGroup {...props} />,
      { state: mockInitialState },
    );

    fireEvent.press(getByText(strings('stake.continue')));

    expect(toJSON()).toMatchSnapshot();
    expect(mockAttemptUnstakeTransaction).toHaveBeenCalledTimes(1);
  });

  describe.each([
    {
      action: FooterButtonGroupActions.STAKE,
      attemptMock: mockAttemptDepositTransaction,
      otherAttemptMock: mockAttemptUnstakeTransaction,
      location: EVENT_LOCATIONS.STAKE_CONFIRMATION_VIEW,
      events: {
        INITIATED: MetaMetricsEvents.STAKE_TRANSACTION_INITIATED,
        APPROVED: MetaMetricsEvents.STAKE_TRANSACTION_APPROVED,
        SUBMITTED: MetaMetricsEvents.STAKE_TRANSACTION_SUBMITTED,
        FAILED: MetaMetricsEvents.STAKE_TRANSACTION_FAILED,
        REJECTED: MetaMetricsEvents.STAKE_TRANSACTION_REJECTED,
        CONFIRMED: MetaMetricsEvents.STAKE_TRANSACTION_CONFIRMED,
      },
    },
    {
      action: FooterButtonGroupActions.UNSTAKE,
      attemptMock: mockAttemptUnstakeTransaction,
      otherAttemptMock: mockAttemptDepositTransaction,
      location: EVENT_LOCATIONS.UNSTAKE_CONFIRMATION_VIEW,
      events: {
        INITIATED: MetaMetricsEvents.UNSTAKE_TRANSACTION_INITIATED,
        APPROVED: MetaMetricsEvents.UNSTAKE_TRANSACTION_APPROVED,
        SUBMITTED: MetaMetricsEvents.UNSTAKE_TRANSACTION_SUBMITTED,
        FAILED: MetaMetricsEvents.UNSTAKE_TRANSACTION_FAILED,
        REJECTED: MetaMetricsEvents.UNSTAKE_TRANSACTION_REJECTED,
        CONFIRMED: MetaMetricsEvents.UNSTAKE_TRANSACTION_CONFIRMED,
      },
    },
  ])(
    '$action transaction lifecycle',
    ({ action, attemptMock, otherAttemptMock, location, events }) => {
      const VALUE_WEI = '3210000000000000';
      const TX_ID = '123';
      const LIFECYCLE_EVENTS = {
        APPROVED: 'TransactionController:transactionApproved',
        SUBMITTED: 'TransactionController:transactionSubmitted',
        FAILED: 'TransactionController:transactionFailed',
        REJECTED: 'TransactionController:transactionRejected',
        CONFIRMED: 'TransactionController:transactionConfirmed',
      } as const;

      type LifecycleKey = keyof typeof LIFECYCLE_EVENTS;

      const buildExpectedEvent = (event: IMetaMetricsEvent) =>
        MetricsEventBuilder.createEventBuilder(event)
          .addProperties({
            selected_provider: EVENT_PROVIDERS.CONSENSYS,
            location,
            transaction_amount_eth: '0.00321',
          })
          .build();

      const renderComponent = () =>
        renderWithProvider(
          <FooterButtonGroup valueWei={VALUE_WEI} action={action} />,
          { state: mockInitialState },
        );

      const getSubscription = (key: LifecycleKey) => {
        const call = mockSubscribeOnceIf.mock.calls.find(
          ([eventName]) => eventName === LIFECYCLE_EVENTS[key],
        );
        if (!call) throw new Error(`No subscription for ${key}`);
        const [, handler, predicate] = call;
        return {
          handler: handler as () => void,
          predicate: predicate as (payload: unknown) => boolean,
        };
      };

      const renderAndConfirm = async () => {
        attemptMock.mockResolvedValue({ transactionMeta: { id: TX_ID } });
        const utils = renderComponent();
        fireEvent.press(utils.getByText(strings('stake.continue')));
        await waitFor(() =>
          expect(mockSubscribeOnceIf).toHaveBeenCalledTimes(5),
        );
        return utils;
      };

      it('tracks the initiated event and attempts the matching transaction', async () => {
        await renderAndConfirm();

        expect(mockTrackEvent).toHaveBeenCalledTimes(1);
        expect(mockTrackEvent).toHaveBeenCalledWith(
          buildExpectedEvent(events.INITIATED),
        );
        expect(attemptMock).toHaveBeenCalledWith(VALUE_WEI, MOCK_ADDRESS_1);
        expect(otherAttemptMock).not.toHaveBeenCalled();
      });

      it('subscribes once to each transaction lifecycle event', async () => {
        await renderAndConfirm();

        expect(mockSubscribeOnceIf.mock.calls.map(([name]) => name)).toEqual(
          Object.values(LIFECYCLE_EVENTS),
        );
      });

      it.each(['APPROVED', 'SUBMITTED', 'FAILED', 'REJECTED'] as const)(
        '%s predicate only matches { transactionMeta } payloads for the submitted transaction id',
        async (key) => {
          await renderAndConfirm();
          const { predicate } = getSubscription(key);

          expect(predicate({ transactionMeta: { id: TX_ID } })).toBe(true);
          expect(predicate({ transactionMeta: { id: 'other-id' } })).toBe(
            false,
          );
        },
      );

      it('CONFIRMED predicate only matches transaction meta payloads for the submitted transaction id', async () => {
        await renderAndConfirm();
        const { predicate } = getSubscription('CONFIRMED');

        expect(predicate({ id: TX_ID })).toBe(true);
        expect(predicate({ id: 'other-id' })).toBe(false);
      });

      it.each([
        'APPROVED',
        'SUBMITTED',
        'FAILED',
        'REJECTED',
        'CONFIRMED',
      ] as const)(
        '%s handler tracks the matching metric event',
        async (key) => {
          await renderAndConfirm();
          mockTrackEvent.mockClear();

          act(() => getSubscription(key).handler());

          expect(mockTrackEvent).toHaveBeenCalledTimes(1);
          expect(mockTrackEvent).toHaveBeenCalledWith(
            buildExpectedEvent(events[key]),
          );
        },
      );

      it('SUBMITTED handler navigates to the transactions view and resets the continue button', async () => {
        const { getByText, queryByText } = await renderAndConfirm();
        expect(queryByText(strings('stake.continue'))).toBeNull();

        act(() => getSubscription('SUBMITTED').handler());

        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(Routes.TRANSACTIONS_VIEW);
        expect(getByText(strings('stake.continue'))).toBeDefined();
      });

      it.each(['APPROVED', 'CONFIRMED'] as const)(
        '%s handler does not navigate or reset the continue button',
        async (key) => {
          const { queryByText } = await renderAndConfirm();

          act(() => getSubscription(key).handler());

          expect(mockNavigate).not.toHaveBeenCalled();
          expect(queryByText(strings('stake.continue'))).toBeNull();
        },
      );

      it.each(['FAILED', 'REJECTED'] as const)(
        '%s handler re-enables the continue button without navigating',
        async (key) => {
          const { getByText, queryByText } = await renderAndConfirm();
          expect(queryByText(strings('stake.continue'))).toBeNull();

          act(() => getSubscription(key).handler());

          expect(mockNavigate).not.toHaveBeenCalled();
          fireEvent.press(getByText(strings('stake.continue')));
          await waitFor(() => expect(attemptMock).toHaveBeenCalledTimes(2));
        },
      );

      it('re-enables the continue button and does not subscribe when the attempt throws', async () => {
        attemptMock.mockRejectedValue(new Error('User rejected'));
        const { getByText } = renderComponent();

        fireEvent.press(getByText(strings('stake.continue')));

        await waitFor(() =>
          expect(getByText(strings('stake.continue'))).toBeDefined(),
        );
        expect(attemptMock).toHaveBeenCalledTimes(1);
        expect(mockSubscribeOnceIf).not.toHaveBeenCalled();

        fireEvent.press(getByText(strings('stake.continue')));
        await waitFor(() => expect(attemptMock).toHaveBeenCalledTimes(2));
      });

      it.each([undefined, {}, { transactionMeta: {} }])(
        'does not subscribe when the attempt resolves with %p',
        async (result) => {
          attemptMock.mockResolvedValue(result);
          const { getByText } = renderComponent();

          fireEvent.press(getByText(strings('stake.continue')));

          await waitFor(() => expect(attemptMock).toHaveBeenCalledTimes(1));
          await act(async () => {
            await Promise.resolve();
          });
          expect(mockSubscribeOnceIf).not.toHaveBeenCalled();
        },
      );
    },
  );
});
