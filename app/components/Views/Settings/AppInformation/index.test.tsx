import { renderScreen } from '../../../../util/test/renderWithProvider';
import AppInformation from './';

describe('AppInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      // @ts-expect-error - renderScreen provides navigation via Stack.Screen
      AppInformation,
      { name: 'AppInformation' },
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
