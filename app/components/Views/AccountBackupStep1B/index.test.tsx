import type React from 'react';
import AccountBackupStep1B from './';
import { renderScreen } from '../../../util/test/renderWithProvider';

describe('AccountBackupStep1B', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ legacyFakeTimers: true });
  });

  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      AccountBackupStep1B as React.ComponentType,
      {
        name: 'AccountBackupStep1B',
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
