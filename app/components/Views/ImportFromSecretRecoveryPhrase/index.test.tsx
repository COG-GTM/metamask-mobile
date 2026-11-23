import React from 'react';
import { renderScreen } from '../../../util/test/renderWithProvider';
import ImportFromSecretRecoveryPhraseComponent from '.';
import Routes from '../../../constants/navigation/Routes';

const ImportFromSecretRecoveryPhrase = ImportFromSecretRecoveryPhraseComponent as unknown as React.ComponentType<
  Record<string, unknown>
>;


const initialState = {
  user: {
    passwordSet: true,
    seedphraseBackedUp: false,
  },
};

describe('ImportFromSecretRecoveryPhrase', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      ImportFromSecretRecoveryPhrase,
      { name: Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE },
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
