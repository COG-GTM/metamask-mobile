import { mockTheme } from '../../../../../../../util/theme';
import createStyles from './style';

describe('info-section createStyles', () => {
  it('returns a container style using theme-driven colors and static layout', () => {
    const styles = createStyles(mockTheme.colors);

    expect(styles.container).toEqual(
      expect.objectContaining({
        backgroundColor: mockTheme.colors.background.default,
        borderColor: mockTheme.colors.border.muted,
        borderRadius: 8,
        borderWidth: 1,
        padding: 8,
        minWidth: '100%',
        marginVertical: 4,
      }),
    );
  });
});
