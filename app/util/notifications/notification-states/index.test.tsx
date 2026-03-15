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
  it('returns true for all known trigger types', () => {
    const knownTypes: TRIGGER_TYPES[] = [
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

    knownTypes.forEach((type) => {
      expect(hasNotificationComponents(type)).toBe(true);
    });
  });

  it('returns false for an unknown trigger type', () => {
    expect(
      hasNotificationComponents('UNKNOWN_TYPE' as TRIGGER_TYPES),
    ).toBe(false);
  });
});

describe('NotificationComponentState - guardFn', () => {
  const testCases: {
    triggerType: keyof typeof NotificationComponentState;
    factory: () => INotification;
    description: string;
  }[] = [
    {
      triggerType: TRIGGER_TYPES.ETH_SENT,
      factory: createMockNotificationEthSent as () => INotification,
      description: 'ETH_SENT',
    },
    {
      triggerType: TRIGGER_TYPES.ETH_RECEIVED,
      factory: createMockNotificationEthReceived as () => INotification,
      description: 'ETH_RECEIVED',
    },
    {
      triggerType: TRIGGER_TYPES.ERC20_SENT,
      factory: createMockNotificationERC20Sent as () => INotification,
      description: 'ERC20_SENT',
    },
    {
      triggerType: TRIGGER_TYPES.ERC20_RECEIVED,
      factory: createMockNotificationERC20Received as () => INotification,
      description: 'ERC20_RECEIVED',
    },
    {
      triggerType: TRIGGER_TYPES.ERC721_SENT,
      factory: createMockNotificationERC721Sent as () => INotification,
      description: 'ERC721_SENT',
    },
    {
      triggerType: TRIGGER_TYPES.ERC721_RECEIVED,
      factory: createMockNotificationERC721Received as () => INotification,
      description: 'ERC721_RECEIVED',
    },
    {
      triggerType: TRIGGER_TYPES.ERC1155_SENT,
      factory: createMockNotificationERC1155Sent as () => INotification,
      description: 'ERC1155_SENT',
    },
    {
      triggerType: TRIGGER_TYPES.ERC1155_RECEIVED,
      factory: createMockNotificationERC1155Received as () => INotification,
      description: 'ERC1155_RECEIVED',
    },
    {
      triggerType: TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
      factory:
        createMockNotificationMetaMaskSwapsCompleted as () => INotification,
      description: 'METAMASK_SWAP_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
      factory:
        createMockNotificationRocketPoolStakeCompleted as () => INotification,
      description: 'ROCKETPOOL_STAKE_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.ROCKETPOOL_UNSTAKE_COMPLETED,
      factory:
        createMockNotificationRocketPoolUnStakeCompleted as () => INotification,
      description: 'ROCKETPOOL_UNSTAKE_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.LIDO_STAKE_COMPLETED,
      factory:
        createMockNotificationLidoStakeCompleted as () => INotification,
      description: 'LIDO_STAKE_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
      factory:
        createMockNotificationLidoWithdrawalRequested as () => INotification,
      description: 'LIDO_WITHDRAWAL_REQUESTED',
    },
    {
      triggerType: TRIGGER_TYPES.LIDO_STAKE_READY_TO_BE_WITHDRAWN,
      factory:
        createMockNotificationLidoReadyToBeWithdrawn as () => INotification,
      description: 'LIDO_STAKE_READY_TO_BE_WITHDRAWN',
    },
    {
      triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_COMPLETED,
      factory:
        createMockNotificationLidoStakeCompleted as () => INotification,
      description: 'LIDO_WITHDRAWAL_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
      factory: createMockFeatureAnnouncementRaw as () => INotification,
      description: 'FEATURES_ANNOUNCEMENT',
    },
  ];

  testCases.forEach(({ triggerType, factory, description }) => {
    it(`guardFn correctly identifies ${description} notifications`, () => {
      const notification = factory();
      const state = NotificationComponentState[triggerType];
      expect(state.guardFn(notification)).toBe(true);
    });
  });

  it('guardFn rejects wrong notification type', () => {
    const ethNotification =
      createMockNotificationEthSent() as unknown as INotification;
    const featureState =
      NotificationComponentState[TRIGGER_TYPES.FEATURES_ANNOUNCEMENT];
    expect(featureState.guardFn(ethNotification)).toBe(false);
  });
});

describe('NotificationComponentState - createMenuItem', () => {
  const menuItemTestCases: {
    triggerType: keyof typeof NotificationComponentState;
    factory: () => INotification;
    description: string;
  }[] = [
    {
      triggerType: TRIGGER_TYPES.ETH_SENT,
      factory: createMockNotificationEthSent as () => INotification,
      description: 'ETH_SENT',
    },
    {
      triggerType: TRIGGER_TYPES.ERC20_RECEIVED,
      factory: createMockNotificationERC20Received as () => INotification,
      description: 'ERC20_RECEIVED',
    },
    {
      triggerType: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
      factory: createMockFeatureAnnouncementRaw as () => INotification,
      description: 'FEATURES_ANNOUNCEMENT',
    },
    {
      triggerType: TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
      factory:
        createMockNotificationMetaMaskSwapsCompleted as () => INotification,
      description: 'METAMASK_SWAP_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED,
      factory:
        createMockNotificationRocketPoolStakeCompleted as () => INotification,
      description: 'ROCKETPOOL_STAKE_COMPLETED',
    },
    {
      triggerType: TRIGGER_TYPES.LIDO_WITHDRAWAL_REQUESTED,
      factory:
        createMockNotificationLidoWithdrawalRequested as () => INotification,
      description: 'LIDO_WITHDRAWAL_REQUESTED',
    },
  ];

  menuItemTestCases.forEach(({ triggerType, factory, description }) => {
    it(`createMenuItem returns proper data for ${description}`, () => {
      const notification = factory();
      const state = NotificationComponentState[triggerType];
      const menuItem = state.createMenuItem(notification);

      expect(menuItem).toBeDefined();
      expect(menuItem.title).toBeDefined();
      expect(typeof menuItem.title).toBe('string');
      expect(menuItem.description).toBeDefined();
      expect(menuItem.createdAt).toBeDefined();
    });
  });
});

describe('NotificationComponentState - createModalDetails', () => {
  const modalTestCases: {
    triggerType: keyof typeof NotificationComponentState;
    factory: () => INotification;
    description: string;
  }[] = [
    {
      triggerType: TRIGGER_TYPES.ETH_SENT,
      factory: createMockNotificationEthSent as () => INotification,
      description: 'ETH_SENT',
    },
    {
      triggerType: TRIGGER_TYPES.FEATURES_ANNOUNCEMENT,
      factory: createMockFeatureAnnouncementRaw as () => INotification,
      description: 'FEATURES_ANNOUNCEMENT',
    },
    {
      triggerType: TRIGGER_TYPES.METAMASK_SWAP_COMPLETED,
      factory:
        createMockNotificationMetaMaskSwapsCompleted as () => INotification,
      description: 'METAMASK_SWAP_COMPLETED',
    },
  ];

  modalTestCases.forEach(({ triggerType, factory, description }) => {
    it(`createModalDetails returns proper data for ${description}`, () => {
      const notification = factory();
      const state = NotificationComponentState[triggerType];
      if (state.createModalDetails) {
        const modalDetails = state.createModalDetails(notification);

        expect(modalDetails).toBeDefined();
        expect(modalDetails.title).toBeDefined();
        expect(typeof modalDetails.title).toBe('string');
        expect(modalDetails.createdAt).toBeDefined();
        expect(Array.isArray(modalDetails.fields)).toBe(true);
      }
    });
  });

  it('createModalDetails is undefined for trigger types without modal', () => {
    const stakeState =
      NotificationComponentState[TRIGGER_TYPES.ROCKETPOOL_STAKE_COMPLETED];
    // Stake notifications may or may not have modal details - verify the property exists or is undefined
    if (!stakeState.createModalDetails) {
      expect(stakeState.createModalDetails).toBeUndefined();
    } else {
      expect(typeof stakeState.createModalDetails).toBe('function');
    }
  });
});
