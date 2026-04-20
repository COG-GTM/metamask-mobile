/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationLidoWithdrawalRequested,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalFooterType } from '../../constants';
import state from './lido-withdrawal-requested';

describe('lido-withdrawal-requested notification state', () => {
  it('guardFn accepts LIDO_WITHDRAWAL_REQUESTED only', () => {
    expect(
      state.guardFn(createMockNotificationLidoWithdrawalRequested() as any),
    ).toBe(true);
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem returns the expected shape', () => {
    const menu = state.createMenuItem(
      createMockNotificationLidoWithdrawalRequested() as any,
    );
    expect(menu.title).toEqual(expect.any(String));
    expect(menu.description.start).toEqual(expect.any(String));
    expect(menu.badgeIcon).toBeTruthy();
  });

  it('createModalDetails returns the expected field sequence', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationLidoWithdrawalRequested() as any,
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual([
      ModalFieldType.ADDRESS,
      ModalFieldType.ASSET,
      ModalFieldType.TRANSACTION,
      ModalFieldType.STAKING_PROVIDER,
    ]);
    expect(details.footer).toEqual(
      expect.objectContaining({ type: ModalFooterType.BLOCK_EXPLORER }),
    );
    const provider = details.fields.find(
      (f: any) => f.type === ModalFieldType.STAKING_PROVIDER,
    ) as { stakingProvider: string };
    expect(provider.stakingProvider).toBe('Lido-staked ETH');
  });
});
