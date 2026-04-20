/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationLidoStakeCompleted,
  createMockNotificationLidoWithdrawalCompleted,
  createMockNotificationRocketPoolStakeCompleted,
  createMockNotificationRocketPoolUnStakeCompleted,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalFooterType } from '../../constants';
import state from './stake';

describe('stake notification state', () => {
  it('guardFn accepts stake/unstake completions and rejects other types', () => {
    expect(state.guardFn(createMockNotificationLidoStakeCompleted() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationLidoWithdrawalCompleted() as any)).toBe(
      true,
    );
    expect(
      state.guardFn(createMockNotificationRocketPoolStakeCompleted() as any),
    ).toBe(true);
    expect(
      state.guardFn(createMockNotificationRocketPoolUnStakeCompleted() as any),
    ).toBe(true);
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem returns title, description, image, and badgeIcon', () => {
    const menu = state.createMenuItem(
      createMockNotificationRocketPoolStakeCompleted() as any,
    );
    expect(menu).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        description: expect.objectContaining({
          start: expect.any(String),
          end: expect.any(String),
        }),
        badgeIcon: expect.anything(),
      }),
    );
  });

  it('createModalDetails builds staked asset fields on staked events', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationLidoStakeCompleted() as any,
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual([
      ModalFieldType.ADDRESS,
      ModalFieldType.ASSET,
      ModalFieldType.ASSET,
      ModalFieldType.TRANSACTION,
      ModalFieldType.STAKING_PROVIDER,
    ]);
    expect(details.footer).toEqual(
      expect.objectContaining({ type: ModalFooterType.BLOCK_EXPLORER }),
    );
  });

  it('createModalDetails builds unstaked fields on unstake events', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationRocketPoolUnStakeCompleted() as any,
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toContain(ModalFieldType.STAKING_PROVIDER);
  });
});
