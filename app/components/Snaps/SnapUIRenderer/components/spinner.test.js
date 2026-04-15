import { spinner } from './spinner';

import { mockTheme } from '../../../../util/theme';

describe('spinner component', () => {
  const defaultParams = {
    map: {},
    t: jest.fn(),
    theme: mockTheme
  };

  it('should return the correct element structure', () => {
    const spinnerElement = {
      type: 'Spinner',
      props: {},
      key: null
    };

    const result = spinner({ element: spinnerElement, ...defaultParams });

    expect(result).toEqual({
      element: 'SnapUISpinner'
    });
  });
});