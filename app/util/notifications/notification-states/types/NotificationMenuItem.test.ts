import type { NotificationMenuItem } from './NotificationMenuItem';
import { IconName } from '../../../../component-library/components/Icons/Icon';

describe('NotificationMenuItem type', () => {
  it('accepts a minimal valid shape', () => {
    const item: NotificationMenuItem = {
      title: 'Hello',
      description: { start: 'Start' },
      badgeIcon: IconName.Arrow2UpRight,
      createdAt: '2024-01-01',
    };
    expect(item.title).toBe('Hello');
    expect(item.description.end).toBeUndefined();
    expect(item.image).toBeUndefined();
    expect(item.isRead).toBeUndefined();
  });

  it('accepts the full optional payload', () => {
    const item: NotificationMenuItem = {
      title: 'Full',
      description: { start: 'Start', end: 'End' },
      image: { url: 'https://a.io/img.png', variant: 'square' },
      badgeIcon: IconName.Received,
      createdAt: '2024-02-02',
      isRead: true,
    };
    expect(item.description.end).toBe('End');
    expect(item.image).toEqual({
      url: 'https://a.io/img.png',
      variant: 'square',
    });
    expect(item.isRead).toBe(true);
  });
});
