import type { NotificationMenuItem } from './NotificationMenuItem';
import { IconName } from '../../../../component-library/components/Icons/Icon';

describe('NotificationMenuItem type', () => {
  it('can create a valid NotificationMenuItem', () => {
    const menuItem: NotificationMenuItem = {
      title: 'ETH Received',
      description: {
        start: '0.5 ETH',
        end: '$1000.00',
      },
      badgeIcon: IconName.Arrow2Right,
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(menuItem.title).toBe('ETH Received');
    expect(menuItem.description.start).toBe('0.5 ETH');
    expect(menuItem.description.end).toBe('$1000.00');
    expect(menuItem.createdAt).toBe('2024-01-01T00:00:00Z');
  });

  it('supports optional image field', () => {
    const menuItem: NotificationMenuItem = {
      title: 'NFT Received',
      description: {
        start: 'CryptoKitty #123',
      },
      image: {
        url: 'https://example.com/image.png',
        variant: 'circle',
      },
      badgeIcon: IconName.Arrow2Right,
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(menuItem.image?.url).toBe('https://example.com/image.png');
    expect(menuItem.image?.variant).toBe('circle');
  });

  it('supports optional isRead field', () => {
    const menuItem: NotificationMenuItem = {
      title: 'Test',
      description: { start: 'test' },
      badgeIcon: IconName.Arrow2Right,
      createdAt: '2024-01-01T00:00:00Z',
      isRead: true,
    };
    expect(menuItem.isRead).toBe(true);
  });

  it('supports square image variant', () => {
    const menuItem: NotificationMenuItem = {
      title: 'Test',
      description: { start: 'test' },
      image: { variant: 'square' },
      badgeIcon: IconName.Arrow2Right,
      createdAt: '2024-01-01T00:00:00Z',
    };
    expect(menuItem.image?.variant).toBe('square');
  });
});
