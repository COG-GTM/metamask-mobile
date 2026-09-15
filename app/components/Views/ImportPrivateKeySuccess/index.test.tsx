import React from 'react';
import ImportPrivateKeySuccess from './';
import { renderScreen } from '../../../util/test/renderWithProvider';

const TestImportPrivateKeySuccess =
  ImportPrivateKeySuccess as unknown as React.ComponentType;

describe('ImportPrivateKeySuccess', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(TestImportPrivateKeySuccess, {
      name: 'ImportPrivateKeySuccess',
    });
    expect(toJSON()).toMatchSnapshot();
  });
});
