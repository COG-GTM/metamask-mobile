/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createMockNotificationMetaMaskSwapsCompleted,
  createMockNotificationEthSent,
} from '../../../../components/UI/Notification/__mocks__/mock_notifications';
import { ModalFieldType, ModalFooterType } from '../../constants';
import state from './swap-completed';

describe('swap-completed notification state', () => {
  it('guardFn accepts METAMASK_SWAP_COMPLETED only', () => {
    expect(state.guardFn(createMockNotificationMetaMaskSwapsCompleted() as any)).toBe(
      true,
    );
    expect(state.guardFn(createMockNotificationEthSent() as any)).toBe(false);
  });

  it('createMenuItem contains a badgeIcon, title and description', () => {
    const menu = state.createMenuItem(
      createMockNotificationMetaMaskSwapsCompleted() as any,
    );
    expect(menu.title).toEqual(expect.any(String));
    expect(menu.description).toEqual(
      expect.objectContaining({ start: expect.any(String) }),
    );
    expect(menu.badgeIcon).toBeTruthy();
  });

  it('createModalDetails includes a swap rate field and block-explorer footer', () => {
    const details = (state.createModalDetails as any)(
      createMockNotificationMetaMaskSwapsCompleted() as any,
    );
    const fieldTypes = details.fields.map((f: any) => f.type);
    expect(fieldTypes).toEqual(
      expect.arrayContaining([
        ModalFieldType.ADDRESS,
        ModalFieldType.ASSET,
        ModalFieldType.SWAP_RATE,
        ModalFieldType.TRANSACTION,
        ModalFieldType.NETWORK,
      ]),
    );
    expect(details.footer).toEqual(
      expect.objectContaining({ type: ModalFooterType.BLOCK_EXPLORER }),
    );
  });
});
