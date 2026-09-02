import { renderScreen } from '../../../util/test/renderWithProvider';
import React from 'react';
import ImportFromSecretRecoveryPhrase from '.';

const ImportFromSecretRecoveryPhraseView =
  ImportFromSecretRecoveryPhrase as unknown as React.ComponentType;
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
      ImportFromSecretRecoveryPhraseView,
      { name: Routes.ONBOARDING.IMPORT_FROM_SECRET_RECOVERY_PHRASE },
      { state: initialState },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
