import { mockTheme } from '../../../../../../../../util/theme';
import createStyles from './style';

describe('network info-value createStyles', () => {
  const styles = createStyles(mockTheme.colors);

  it('returns a horizontal container', () => {
    expect(styles.container).toEqual(
      expect.objectContaining({
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
      }),
    );
  });

  it('applies theme text color to the value', () => {
    expect(styles.value.color).toBe(mockTheme.colors.text.default);
  });

  it('applies error-muted background and error text color to the warning badge', () => {
    expect(styles.warningContainer.backgroundColor).toBe(
      mockTheme.colors.error.muted,
    );
    expect(styles.warningText.color).toBe(mockTheme.colors.error.default);
  });
});
