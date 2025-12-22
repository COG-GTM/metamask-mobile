import { renderScreen } from '../../../../util/test/renderWithProvider';
import AppInformation from './';
import { ComponentType } from 'react';

describe('AppInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      AppInformation as unknown as ComponentType,
      { name: 'AppInformation' },
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
