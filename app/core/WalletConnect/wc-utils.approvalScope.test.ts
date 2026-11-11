import { ApprovalController } from '@metamask/approval-controller';
import { Messenger } from '@metamask/base-controller';
import { onRequestUserApproval } from './wc-utils';

const mockEngine: {
  context: { ApprovalController?: ApprovalController };
  controllerMessenger: { call: jest.Mock };
} = {
  context: {},
  controllerMessenger: { call: jest.fn() },
};

jest.mock('../Engine', () => ({
  __esModule: true,
  get default() {
    return mockEngine;
  },
}));

jest.mock('../RPCMethods/RPCMethodMiddleware', () => ({
  getRpcMethodMiddlewareHooks: jest.fn(),
  SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES: {},
}));

jest.mock('../../../app/store', () => ({
  store: { getState: jest.fn(), dispatch: jest.fn() },
}));

const createApprovalController = () =>
  new ApprovalController({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: new Messenger<any, any>().getRestricted({
      name: 'ApprovalController',
      allowedActions: [],
      allowedEvents: [],
    }),
    showApprovalRequest: jest.fn(),
  });

describe('onRequestUserApproval approval scope', () => {
  let approvalController: ApprovalController;

  beforeEach(() => {
    approvalController = createApprovalController();
    mockEngine.context.ApprovalController = approvalController;
  });

  it('keeps pending approvals from other origins', async () => {
    const otherOriginApproval = approvalController.add({
      id: 'other-origin-tx',
      origin: 'https://trusted-dapp.example',
      type: 'transaction',
    });
    const otherOriginOutcome = jest.fn();
    otherOriginApproval.then(otherOriginOutcome, otherOriginOutcome);

    const switchPrompt = onRequestUserApproval('https://mallory.example')({
      type: 'SWITCH_ETHEREUM_CHAIN',
      requestData: { chainId: '0x89' },
    });
    await Promise.resolve();

    expect(approvalController.has({ id: 'other-origin-tx' })).toBe(true);
    expect(otherOriginOutcome).not.toHaveBeenCalled();
    expect(approvalController.getTotalApprovalCount()).toBe(2);

    const switchApproval = Object.values(
      approvalController.state.pendingApprovals,
    ).find((approval) => approval.origin === 'https://mallory.example');
    approvalController.accept(switchApproval?.id as string, { ok: true });
    await expect(switchPrompt).resolves.toStrictEqual({ ok: true });

    expect(approvalController.has({ id: 'other-origin-tx' })).toBe(true);
    approvalController.accept('other-origin-tx');
    await expect(otherOriginApproval).resolves.toBeUndefined();
  });

  it('rejects pending approvals from the requesting origin', async () => {
    const ownApproval = approvalController.add({
      id: 'own-stale-switch',
      origin: 'https://mallory.example',
      type: 'transaction',
    });

    const switchPrompt = onRequestUserApproval('https://mallory.example')({
      type: 'SWITCH_ETHEREUM_CHAIN',
      requestData: { chainId: '0x89' },
    });

    await expect(ownApproval).rejects.toMatchObject({ code: 4001 });
    expect(approvalController.has({ id: 'own-stale-switch' })).toBe(false);
    expect(approvalController.getTotalApprovalCount()).toBe(1);

    approvalController.clear(new Error('cleanup') as never);
    await expect(switchPrompt).rejects.toThrow('cleanup');
  });

  it('rejects pending approvals the requesting dapp has under its hostname', async () => {
    const ownRpcApproval = approvalController.add({
      id: 'own-rpc-approval',
      origin: 'mallory.example',
      type: 'transaction',
    });
    const otherOriginApproval = approvalController.add({
      id: 'other-origin-rpc-approval',
      origin: 'trusted-dapp.example',
      type: 'transaction',
    });

    const switchPrompt = onRequestUserApproval('https://mallory.example')({
      type: 'SWITCH_ETHEREUM_CHAIN',
      requestData: { chainId: '0x89' },
    });

    await expect(ownRpcApproval).rejects.toMatchObject({ code: 4001 });
    expect(approvalController.has({ id: 'other-origin-rpc-approval' })).toBe(
      true,
    );
    expect(approvalController.getTotalApprovalCount()).toBe(2);

    approvalController.clear(new Error('cleanup') as never);
    await expect(switchPrompt).rejects.toThrow('cleanup');
    await expect(otherOriginApproval).rejects.toThrow('cleanup');
  });
});
