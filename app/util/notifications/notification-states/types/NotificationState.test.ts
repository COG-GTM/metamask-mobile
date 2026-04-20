import { TRIGGER_TYPES } from '@metamask/notification-services-controller/notification-services';
import {
  label_address_from,
  label_address_to,
} from './NotificationState';

const mockSent = {
  type: TRIGGER_TYPES.ETH_SENT,
} as Parameters<typeof label_address_from>[0];
const mockReceived = {
  type: TRIGGER_TYPES.ETH_RECEIVED,
} as Parameters<typeof label_address_from>[0];

describe('NotificationState label helpers', () => {
  it('label_address_from returns different strings for sent vs. received', () => {
    const sent = label_address_from(mockSent);
    const received = label_address_from(mockReceived);
    expect(sent).not.toBe(received);
    expect(typeof sent).toBe('string');
    expect(typeof received).toBe('string');
  });

  it('label_address_to returns different strings for sent vs. received', () => {
    const sent = label_address_to(mockSent);
    const received = label_address_to(mockReceived);
    expect(sent).not.toBe(received);
  });

  it('handles ERC20/ERC721/ERC1155 sent variants as "sent"', () => {
    const erc20Sent = {
      type: TRIGGER_TYPES.ERC20_SENT,
    } as Parameters<typeof label_address_from>[0];
    const erc721Sent = {
      type: TRIGGER_TYPES.ERC721_SENT,
    } as Parameters<typeof label_address_from>[0];
    const erc1155Sent = {
      type: TRIGGER_TYPES.ERC1155_SENT,
    } as Parameters<typeof label_address_from>[0];
    expect(label_address_from(erc20Sent)).toBe(label_address_from(mockSent));
    expect(label_address_from(erc721Sent)).toBe(label_address_from(mockSent));
    expect(label_address_from(erc1155Sent)).toBe(label_address_from(mockSent));
  });
});
