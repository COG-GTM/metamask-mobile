import ImportPrivateKeySuccess from './';
import { renderScreen } from '../../../util/test/renderWithProvider';
import { ComponentType } from 'react';

describe('ImportPrivateKeySuccess', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      ImportPrivateKeySuccess as unknown as ComponentType,
      {
        name: 'ImportPrivateKeySuccess',
      },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
