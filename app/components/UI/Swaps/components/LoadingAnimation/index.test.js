import React from 'react';
import renderWithProvider from

'../../../../../util/test/renderWithProvider';
import LoadingAnimation from './';
import { backgroundState } from '../../../../../util/test/initial-root-state';


const mockInitialState = {
  engine: {
    backgroundState: {
      ...backgroundState
    }
  }
};

describe('LoadingAnimation', () => {
  it('renders', () => {
    const wrapper = renderWithProvider(<LoadingAnimation />, {
      state: mockInitialState
    });
    expect(wrapper).toMatchSnapshot();
  });
});