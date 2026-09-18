import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import ThemeSettings from '.';
import renderWithProvider from '../../../util/test/renderWithProvider';
import { AppThemeKey } from '../../../util/theme/models';
import { strings } from '../../../../locales/i18n';
import { userInitialState } from '../../../reducers/user';

const mockDismissModal = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

jest.mock('../../UI/ReusableModal', () => {
  const ReactMock = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const ReusableModal = ReactMock.forwardRef(
    (
      { children }: { children: React.ReactNode },
      ref: React.Ref<{ dismissModal: () => void }>,
    ) => {
      ReactMock.useImperativeHandle(ref, () => ({
        dismissModal: mockDismissModal,
      }));
      return <View>{children}</View>;
    },
  );
  return { __esModule: true, default: ReusableModal };
});

const renderThemeSettings = (appTheme: AppThemeKey) =>
  renderWithProvider(<ThemeSettings />, {
    state: { user: { ...userInitialState, appTheme } },
  });

describe('ThemeSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all theme options', () => {
    const { getByText } = renderThemeSettings(AppThemeKey.os);
    Object.values(AppThemeKey).forEach((theme) => {
      expect(getByText(strings(`app_settings.theme_${theme}`))).toBeTruthy();
    });
  });

  it('dispatches setAppTheme and dismisses the modal when an option is pressed', () => {
    const { getByText, store } = renderThemeSettings(AppThemeKey.os);

    fireEvent.press(getByText(strings(`app_settings.theme_${AppThemeKey.dark}`)));

    expect(store.getState().user.appTheme).toBe(AppThemeKey.dark);
    expect(mockDismissModal).toHaveBeenCalledTimes(1);
  });

  it('marks the currently selected theme', () => {
    const light = renderThemeSettings(AppThemeKey.light).toJSON();
    const dark = renderThemeSettings(AppThemeKey.dark).toJSON();
    expect(JSON.stringify(light)).not.toEqual(JSON.stringify(dark));
  });
});
