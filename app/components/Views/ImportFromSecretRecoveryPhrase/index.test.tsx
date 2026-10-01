import { renderScreen } from '../../../util/test/renderWithProvider';
import ImportFromSecretRecoveryPhrase from '.';
import Routes from '../../../constants/navigation/Routes';

const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
};

describe('ImportFromSecretRecoveryPhrase', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      ImportFromSecretRecoveryPhrase as unknown as Parameters<
        typeof renderScreen
      >[0],
      { name: Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE },
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
