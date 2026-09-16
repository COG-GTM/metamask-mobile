import {
  DeepPartial,
  renderScreen,
} from '../../../util/test/renderWithProvider';
import { backgroundState } from '../../../util/test/initial-root-state';
import LockScreen from './';
import Routes from '../../../constants/navigation/Routes';
import { MOCK_ACCOUNTS_CONTROLLER_STATE } from '../../../util/test/accountsControllerTestUtils';
import { RootState } from '../../../reducers';

const mockInitialState: DeepPartial<RootState> = {
  settings: {},
  engine: {
    backgroundState: {
      ...backgroundState,
      PreferencesController: {
        securityAlertsEnabled: true,
      },
      AccountsController: MOCK_ACCOUNTS_CONTROLLER_STATE,
    },
  },
};

describe('LockScreen', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      // @ts-expect-error navigation params are intentionally omitted; renderScreen supplies them via the navigator
      LockScreen,
      { name: Routes.LOCK_SCREEN },
      { state: mockInitialState },
      { bioStateMachineId: '' },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
