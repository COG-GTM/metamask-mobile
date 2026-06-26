import { renderScreen } from '../../../../util/test/renderWithProvider';
import AppInformation from './';

describe('AppInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      AppInformation as unknown as Parameters<typeof renderScreen>[0],
      { name: 'AppInformation' },
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
