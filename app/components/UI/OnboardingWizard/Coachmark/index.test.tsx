import React from 'react';
import renderWithProvider from '../../../../util/test/renderWithProvider';
import Coachmark from './';
jest.useFakeTimers();

describe('Coachmark', () => {
  it('should render correctly', () => {
    const { toJSON } = renderWithProvider(
      <Coachmark
// @ts-expect-error -- legacy JavaScript UI type boundary
        content={'content'}
        title={'title'}
        currentStep={1}
        topIndicatorPosition={'topLeft'}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });
});
