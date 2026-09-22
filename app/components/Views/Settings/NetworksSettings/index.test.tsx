import { renderScreen } from '../../../../util/test/renderWithProvider';
import NetworksSettings from './';
import { backgroundState } from '../../../../util/test/initial-root-state';

const NetworksSettingsForTest = NetworksSettings as React.ComponentType<
  Partial<React.ComponentProps<typeof NetworksSettings>>
>;

const initialState = {
  engine: {
    backgroundState,
  },
};

describe('NetworksSettings', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      NetworksSettingsForTest,
      { name: 'Network Settings' },
      {
        state: initialState,
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
