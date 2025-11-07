import { renderScreen } from '../../../../util/test/renderWithProvider';
import AppInformation from './';

describe('AppInformation', () => {
  it('should render correctly', () => {
    const { toJSON } = renderScreen(
      //@ts-expect-error we are ignoring the navigation params on purpose because we do not want to mock setOptions to test the navbar
      AppInformation,
      { name: 'AppInformation' },
      { state: {} },
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
