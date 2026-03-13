import {
  TRIGGER_TYPES,
  INotification,
} from '@metamask/notification-services-controller/notification-services';
import {
  hasNotificationModal,
  hasNotificationComponents,
  NotificationComponentState,
} from '.';
import {
  createMockNotificationEthSent,
  createMockNotificationEthReceived,
  createMockNotificationERC20Sent,
  createMockNotificationERC20Received,
  createMockNotificationERC721Sent,
  createMockNotificationERC721Received,
  createMockNotificationERC1155Sent,
  createMockNotificationERC1155Received,
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationLidoWithdrawalCompleted,
  createMockFeatureAnnouncementRaw,
} from '../__test-utils__/mock-notifications';

describe('hasNotificationModal', () => {
  const mockNotificationComponentState = (
    createModalDetails: boolean | undefined,
  ) => {
    NotificationComponentState[TRIGGER_TYPES.ERC20_SENT] = {
      guardFn: (n): n is INotification => true,
      createMenuItem: jest.fn(),
      createModalDetails: createModalDetails ? jest.fn() : undefined,
    };
  };

  afterEach(() => {
    delete (NotificationComponentState as { [key in TRIGGER_TYPES]?: unknown })[
      TRIGGER_TYPES.ERC20_SENT
    ];
  });

  it('returns false for an invalid trigger type', () => {
    const invalidTriggerType = 'INVALID_TRIGGER' as TRIGGER_TYPES;

    const result = hasNotificationModal(invalidTriggerType);

    expect(result).toBe(false);
  });

  it('returns false when createModalDetails is undefined', () => {
    mockNotificationComponentState(undefined);

    const result = hasNotificationModal(TRIGGER_TYPES.ERC20_SENT);

    expect(result).toBe(false);
  });

  it('returns true when createModalDetails is defined', () => {
    mockNotificationComponentState(true);

    const result = hasNotificationModal(TRIGGER_TYPES.ERC20_SENT);

    expect(result).toBe(true);
  });
});

describe('hasNotificationComponents', () => {
  it('returns true for all valid trigger types', () => {
    const validTypes: TRIGGER_TYPES[] = [
      TRIGGER_TYPES.ERC20_SENT,
      TRIGGER_TYPES.ERC20_RECEIVED,
      TRIGGER_TYPES.ERC721_SENT,
      TRIGGER_TYPES.ERC721_RECEIVED,
      TRIGGER_TYPES.ERC1155_SENT,
      TRIGGER_TYPES.ERC1155_RECEIVED,
      TRIGGER_TYPES.ETH_SENT,
      TRIGGER_TYPES.ETH_RECEIVED,
      TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
      TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
      TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
      TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
      TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
      TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
      TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
      TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
    ];

    validTypes.forEach((type) => {
      expect(hasNotificationComponents(type)).toBe(true);
    });
  });

  it('returns false for an invalid trigger type', () => {
    expect(hasNotificationComponents('INVALID' as TRIGGER_TYPES)).toBe(false);
  });
});

describe('NotificationComponentState - guardFn', () => {
  const triggerToMock: Array<{
    triggerType: TRIGGER_TYPES;
    factory: () => INotification;
  }> = [
    { triggerType: TRIGGER_TYPES.ETH_SENT, factory: createMockNotificationEthSent },
    { triggerType: TRIGGER_TYPES.ETH_RECEIVED, factory: createMockNotificationEthReceived },
    { triggerType: TRIGGER_TYPES.ERC20_SENT, factory: createMockNotificationERC20Sent },
    { triggerType: TRIGGER_TYPES.ERC20_RECEIVED, factory: createMockNotificationERC20Received },
    { triggerType: TRIGGER_TYPES.ERC721_SENT, factory: createMockNotificationERC721Sent },
    { triggerType: TRIGGER_TYPES.ERC721_RECEIVED, factory: createMockNotificationERC721Received },
    { triggerType: TRIGGER_TYPES.ERC1155_SENT, factory: createMockNotificationERC1155Sent },
    { triggerType: TRIGGER_TYPES.ERC1155_RECEIVED, factory: createMockNotificationERC1155Received },
    { triggerType: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT, factory: createMockFeatureAnnouncementRaw },
    { triggerType: TRIGGER_TYPES.METAMASK_SWAP_COMPLETED, factory: createMockNotificationMetaMaskSwapsCompleted },
    { triggerType: TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED, factory: createMockNotificationRocketPoolStakeCompleted },
    { triggerType: TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED, factory: createMockNotificationRocketPoolUnStakeCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_STAKE_COMPLETED, factory: createMockNotificationLidoStakeCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED, factory: createMockNotificationLidoWithdrawalCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED, factory: createMockNotificationLidoWithdrawalRequested },
    { triggerType: TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN, factory: createMockNotificationLidoReadyToBeWithdrawn },
  ];

  triggerToMock.forEach(({ triggerType, factory }) => {
    it(`guardFn correctly identifies ${triggerType} notification`, () => {
      const state = NotificationComponentState[triggerType];
      const notification = factory();
      expect(state.guardFn(notification)).toBe(true);
    });
  });

  it('guardFn rejects a notification of the wrong type', () => {
    const ethState = NotificationComponentState[TRIGGER_TYPES.ETH_SENT];
    const erc20Notification = createMockNotificationERC20Sent();
    expect(ethState.guardFn(erc20Notification)).toBe(false);
  });
});

describe('NotificationComponentState - createMenuItem', () => {
  const triggerToMock: Array<{
    triggerType: TRIGGER_TYPES;
    factory: () => INotification;
  }> = [
    { triggerType: TRIGGER_TYPES.ETH_SENT, factory: createMockNotificationEthSent },
    { triggerType: TRIGGER_TYPES.ETH_RECEIVED, factory: createMockNotificationEthReceived },
    { triggerType: TRIGGER_TYPES.ERC20_SENT, factory: createMockNotificationERC20Sent },
    { triggerType: TRIGGER_TYPES.ERC20_RECEIVED, factory: createMockNotificationERC20Received },
    { triggerType: TRIGGER_TYPES.ERC721_SENT, factory: createMockNotificationERC721Sent },
    { triggerType: TRIGGER_TYPES.ERC721_RECEIVED, factory: createMockNotificationERC721Received },
    { triggerType: TRIGGER_TYPES.ERC1155_SENT, factory: createMockNotificationERC1155Sent },
    { triggerType: TRIGGER_TYPES.ERC1155_RECEIVED, factory: createMockNotificationERC1155Received },
    { triggerType: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT, factory: createMockFeatureAnnouncementRaw },
    { triggerType: TRIGGER_TYPES.METAMASK_SWAP_COMPLETED, factory: createMockNotificationMetaMaskSwapsCompleted },
    { triggerType: TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED, factory: createMockNotificationRocketPoolStakeCompleted },
    { triggerType: TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED, factory: createMockNotificationRocketPoolUnStakeCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_STAKE_COMPLETED, factory: createMockNotificationLidoStakeCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED, factory: createMockNotificationLidoWithdrawalCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED, factory: createMockNotificationLidoWithdrawalRequested },
    { triggerType: TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN, factory: createMockNotificationLidoReadyToBeWithdrawn },
  ];

  triggerToMock.forEach(({ triggerType, factory }) => {
    it(`createMenuItem returns valid menu item for ${triggerType}`, () => {
      const state = NotificationComponentState[triggerType];
      const notification = factory();
      const menuItem = state.createMenuItem(notification);

      expect(menuItem).toBeDefined();
      expect(menuItem.title).toBeDefined();
      expect(typeof menuItem.title).toBe('string');
      expect(menuItem.createdAt).toBeDefined();
    });
  });
});

describe('NotificationComponentState - createModalDetails', () => {
  const triggerTypesWithModals: Array<{
    triggerType: TRIGGER_TYPES;
    factory: () => INotification;
  }> = [
    { triggerType: TRIGGER_TYPES.ETH_SENT, factory: createMockNotificationEthSent },
    { triggerType: TRIGGER_TYPES.ETH_RECEIVED, factory: createMockNotificationEthReceived },
    { triggerType: TRIGGER_TYPES.ERC20_SENT, factory: createMockNotificationERC20Sent },
    { triggerType: TRIGGER_TYPES.ERC20_RECEIVED, factory: createMockNotificationERC20Received },
    { triggerType: TRIGGER_TYPES.ERC721_SENT, factory: createMockNotificationERC721Sent },
    { triggerType: TRIGGER_TYPES.ERC721_RECEIVED, factory: createMockNotificationERC721Received },
    { triggerType: TRIGGER_TYPES.ERC1155_SENT, factory: createMockNotificationERC1155Sent },
    { triggerType: TRIGGER_TYPES.ERC1155_RECEIVED, factory: createMockNotificationERC1155Received },
    { triggerType: TRIGGER_TYPES.METAMASK_SWAP_COMPLETED, factory: createMockNotificationMetaMaskSwapsCompleted },
    { triggerType: TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED, factory: createMockNotificationRocketPoolStakeCompleted },
    { triggerType: TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED, factory: createMockNotificationRocketPoolUnStakeCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_STAKE_COMPLETED, factory: createMockNotificationLidoStakeCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED, factory: createMockNotificationLidoWithdrawalCompleted },
    { triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED, factory: createMockNotificationLidoWithdrawalRequested },
    { triggerType: TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN, factory: createMockNotificationLidoReadyToBeWithdrawn },
  ];

  triggerTypesWithModals.forEach(({ triggerType, factory }) => {
    it(`createModalDetails returns valid modal data for ${triggerType}`, () => {
      const state = NotificationComponentState[triggerType];
      if (!state.createModalDetails) {
        return;
      }
      const notification = factory();
      const modalDetails = state.createModalDetails(notification);

      expect(modalDetails).toBeDefined();
      expect(modalDetails.title).toBeDefined();
      expect(typeof modalDetails.title).toBe('string');
      expect(modalDetails.createdAt).toBeDefined();
      expect(modalDetails.fields).toBeDefined();
      expect(Array.isArray(modalDetails.fields)).toBe(true);
    });
  });

  it('feature announcement does not have createModalDetails', () => {
    const state =
      NotificationComponentState[TRIGGER_TYPES.FEATURES_ANNOUNCEMENT];
    expect(state.createModalDetails).toBeUndefined();
  });
});
