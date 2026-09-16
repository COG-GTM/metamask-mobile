import ImportPrivateKeySuccess from './';
import { renderScreen } from '../../../util/test/renderWithProvider';

describe('ImportPrivateKeySuccess', () => {
  it('should render correctly', () => {
    // @ts-expect-error navigation params are intentionally omitted; renderScreen supplies them via the navigator
    const { toJSON } = renderScreen(ImportPrivateKeySuccess, {
      name: 'ImportPrivateKeySuccess',
    });
    expect(toJSON()).toMatchSnapshot();
  });
});
