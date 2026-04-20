import styleSheet from './PermissionItem.style';

describe('PermissionItem.style', () => {
  it('returns an object with the expected style keys', () => {
    const styles = styleSheet();
    expect(Object.keys(styles)).toEqual(
      expect.arrayContaining([
        'container',
        'iconContainer',
        'icon',
        'contentContainer',
        'row',
        'text',
        'dot',
        'chevronContainer',
      ]),
    );
  });

  it('container uses a horizontal flex layout', () => {
    const styles = styleSheet();
    expect(styles.container).toEqual(
      expect.objectContaining({
        flexDirection: 'row',
        alignItems: 'center',
      }),
    );
  });

  it('icon has fixed dimensions', () => {
    const styles = styleSheet();
    expect(styles.icon).toEqual(
      expect.objectContaining({
        width: 24,
        height: 24,
        resizeMode: 'contain',
      }),
    );
  });

  it('text and dot share the same font size', () => {
    const styles = styleSheet();
    expect(styles.text.fontSize).toBe(14);
    expect(styles.dot.fontSize).toBe(14);
  });

  it('returns a new style object on each call', () => {
    const a = styleSheet();
    const b = styleSheet();
    expect(a).toEqual(b);
  });
});
