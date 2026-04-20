/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationLidoReadyToBeWithdrawn,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalFooterType } from '../../constants';
import state from './lido-stake-ready-to-be-withdrawn';

describe('lido-stake-ready-to-be-withdrawn notification state', () => {
  it('guardFn accepts LIDO_STAKE_READY_TO_BE_WITHDRAWN only', () => {
    expect(
      state.guardFn(createMockNotificationLidoReadyToBeWithdrawn() as any),
    ).toBe(true);
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem builds a title and description.start with the token symbol', () => {
    const menu = state.createMenuItem(
      createMockNotificationLidoReadyToBeWithdrawn() as any,
    );
    expect(menu.title).toEqual(expect.any(String));
    expect(menu.description.start).toEqual(expect.any(String));
    expect(menu.badgeIcon).toBeTruthy();
  });

  it('createModalDetails exposes address/asset/transaction/staking_provider fields', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationLidoReadyToBeWithdrawn() as any,
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
  });
});
