import React from 'react';
import { shallow } from 'enzyme';
import PersonalSign from '.';
import configureMockStore from 'redux-mock-store';
import { Provider, useSelector } from 'react-redux';
import { WALLET_CONNECT_ORIGIN } from '../../../../../../util/walletconnect';
import SignatureRequest from '../SignatureRequest';
import Engine from '../../../../../../core/Engine';
import NotificationManager from '../../../../../../core/NotificationManager';
import { InteractionManager } from 'react-native';
import AppConstants from '../../../../../../core/AppConstants';
import { strings } from '../../../../../../../locales/i18n';
import { backgroundState } from '../../../../../../util/test/initial-root-state';
import { useMetrics } from '../../../../../../components/hooks/useMetrics';
import { MetaMetricsEvents } from '../../../../../../core/Analytics';
import initialBackgroundState from '../../../../../../util/test/initial-background-state.json';

jest.mock('../../../../../../components/hooks/useMetrics');
jest.mock('../../../../../../core/Engine', () => ({
  acceptPendingApproval: jest.fn(),
  rejectPendingApproval: jest.fn(),
  context: {
    SignatureController: {
      hub: {
        on: jest.fn(),
      },
    },
    KeyringController: {
      state: {
        keyrings: [],
      },
    },
    PreferencesController: {
      state: {
        securityAlertsEnabled: true,
      },
    },
  },
}));

jest.mock('../../../../../../core/NotificationManager', () => ({
  showSimpleNotification: jest.fn(),
}));

jest.mock('@react-navigation/native');

const messageParamsMock = {
  data: 'message',
  from: '0xC4955C0d639D99699Bfd7Ec54d9FaFEe40e4D272',
  origin: 'origin',
  metamaskId: 'id',
};

const mockStore = configureMockStore();

const initialState = {
  engine: {
    backgroundState,
  },
};

const store = mockStore(initialState);

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../../util/address', () => ({
  getAddressAccountType: jest.fn().mockReturnValue('Metamask'),
  isExternalHardwareAccount: jest.fn().mockReturnValue(false),
}));

const mockTrackEvent = jest.fn();
const mockAddProperties = jest.fn().mockReturnThis();
const mockBuild = jest.fn().mockReturnThis();
const mockCreateEventBuilder = jest.fn().mockReturnValue({
  addProperties: mockAddProperties,
  build: mockBuild,
});

(useMetrics as jest.Mock).mockReturnValue({
  trackEvent: mockTrackEvent,
  createEventBuilder: mockCreateEventBuilder,
});

function createWrapper({
  origin = messageParamsMock.origin,
  mockConfirm = jest.fn(),
  mockReject = jest.fn(),
} = {}) {
  return shallow(
    <Provider store={store}>
      <PersonalSign
        currentPageInformation={{
          title: 'title',
          url: 'http://localhost:8545',
        }}
        messageParams={{
          ...messageParamsMock,
          origin,
        }}
        onConfirm={mockConfirm}
        onReject={mockReject}
      />
    </Provider>,
  ).find(PersonalSign);
}

describe('PersonalSign', () => {
  const useSelectorMock = jest.mocked(useSelector);

  beforeEach(() => {
    useSelectorMock.mockReset();

    useSelectorMock.mockImplementationOnce((callback) =>
      callback({
        signatureRequest: {
          securityAlertResponse: {
            description: '',
            features: [],
            providerRequestsCount: { eth_chainId: 1 },
            reason: '',
            result_type: 'Benign',
          },
        },
      }),
    );

    useSelectorMock.mockImplementationOnce((callback) =>
      callback({
        engine: {
          backgroundState: {
            SignatureController: {
              signatureRequests: {
                [messageParamsMock.metamaskId]: {
                  chainId: '1',
                  messageParams: messageParamsMock,
                },
              },
            },
          },
        },
      }),
    );

    useSelectorMock.mockImplementationOnce((callback) =>
      callback({
        engine: {
          backgroundState: initialBackgroundState,
        },
      }),
    );
  });

  it('should render correctly', () => {
    const wrapper = createWrapper();
    expect(wrapper).toMatchSnapshot();
  });

  describe('onConfirm', () => {
    it('signs message', async () => {
      const onConfirmMock = jest.fn();
      const wrapper = createWrapper({ mockConfirm: onConfirmMock }).dive();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.find(SignatureRequest).props() as any).onConfirm();

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['wallet connect', WALLET_CONNECT_ORIGIN],
      ['SDK remote', AppConstants.MM_SDK.SDK_REMOTE_ORIGIN],
    ])('shows notification if origin is %s', async (_title, origin) => {
      jest
        .spyOn(InteractionManager, 'runAfterInteractions')
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation((callback: any) => callback());

      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (NotificationManager.showSimpleNotification as any).mockReset();

      const wrapper = createWrapper({ origin }).dive();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.find(SignatureRequest).props() as any).onConfirm();

      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith({
        status: `simple_notification`,
        duration: 5000,
        title: strings('notifications.wc_signed_title'),
        description: strings('notifications.wc_description'),
      });
    });
  });

  describe('onReject', () => {
    it('rejects message', async () => {
      const onRejectMock = jest.fn();
      const wrapper = createWrapper({ mockReject: onRejectMock }).dive();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.find(SignatureRequest).props() as any).onReject();

      expect(onRejectMock).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['wallet connect', WALLET_CONNECT_ORIGIN],
      ['SDK remote', AppConstants.MM_SDK.SDK_REMOTE_ORIGIN],
    ])('shows notification if origin is %s', async (_title, origin) => {
      jest
        .spyOn(InteractionManager, 'runAfterInteractions')
        // TODO: Replace "any" with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .mockImplementation((callback: any) => callback());

      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (NotificationManager.showSimpleNotification as any).mockReset();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (Engine.context.SignatureController.hub.on as any).mockReset();

      const wrapper = createWrapper({ origin }).dive();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.find(SignatureRequest).props() as any).onReject();

      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(NotificationManager.showSimpleNotification).toHaveBeenCalledWith({
        status: `simple_notification_rejected`,
        duration: 5000,
        title: strings('notifications.wc_signed_rejected_title'),
        description: strings('notifications.wc_description'),
      });
    });
  });

  describe('trackEvent', () => {
    const expectedProperties = {
      account_type: 'Metamask',
      dapp_host_name: 'localhost:8545',
      chain_id: '1',
      signature_type: 'personal_sign',
      security_alert_response: 'Benign',
      security_alert_reason: '',
      security_alert_source: undefined,
      ppom_eth_chainId_count: 1,
    };

    beforeEach(() => {
      mockTrackEvent.mockClear();
      mockAddProperties.mockClear();
      mockCreateEventBuilder.mockClear();
    });

    it('tracks event for rejected requests', async () => {
      const onRejectMock = jest.fn();
      const wrapper = createWrapper({ mockReject: onRejectMock }).dive();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.find(SignatureRequest).props() as any).onReject();

      expect(onRejectMock).toHaveBeenCalledTimes(1);
      expect(mockCreateEventBuilder).toHaveBeenCalledTimes(1);
      expect(mockCreateEventBuilder).toHaveBeenCalledWith(
        MetaMetricsEvents.SIGNATURE_REJECTED,
      );
      expect(mockAddProperties).toHaveBeenCalledTimes(1);
      expect(mockAddProperties.mock.calls[0][0]).toStrictEqual(
        expectedProperties,
      );
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });

    it('tracks event for approved requests', async () => {
      const onConfirmMock = jest.fn();
      const wrapper = createWrapper({ mockConfirm: onConfirmMock }).dive();
      // TODO: Replace "any" with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (wrapper.find(SignatureRequest).props() as any).onConfirm();

      expect(onConfirmMock).toHaveBeenCalledTimes(1);
      expect(mockCreateEventBuilder).toHaveBeenCalledTimes(1);
      expect(mockCreateEventBuilder).toHaveBeenCalledWith(
        MetaMetricsEvents.SIGNATURE_APPROVED,
      );
      expect(mockAddProperties).toHaveBeenCalledTimes(1);
      expect(mockAddProperties.mock.calls[0][0]).toStrictEqual(
        expectedProperties,
      );
      expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    });
  });
});
