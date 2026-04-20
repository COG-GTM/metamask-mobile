/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({ isVisible, children }) =>
      isVisible ? <RN.View>{children}</RN.View> : null,
  };
});

jest.mock('../../SlippageSlider', () => {
  const RN = jest.requireActual('react-native');
  const Slider = (props) => (
    <RN.View
      testID="slippage-slider"
      onTouchStart={() => props.onChange && props.onChange(3)}
    />
  );
  return { __esModule: true, default: Slider };
});

import SlippageModal from './SlippageModal';

describe('SlippageModal', () => {
  it('matches snapshot when visible', () => {
    const { toJSON } = render(
      <SlippageModal
        isVisible
        dismiss={jest.fn()}
        onChange={jest.fn()}
        slippage={1}
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders slippage slider when visible', () => {
    const { getByTestId } = render(
      <SlippageModal
        isVisible
        dismiss={jest.fn()}
        onChange={jest.fn()}
        slippage={1}
      />,
    );
    expect(getByTestId('slippage-slider')).toBeTruthy();
  });

  it('forwards onChange from the slider', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SlippageModal
        isVisible
        dismiss={jest.fn()}
        onChange={onChange}
        slippage={1}
      />,
    );
    fireEvent(getByTestId('slippage-slider'), 'touchStart');
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('renders warning text when slippage is >= 5', () => {
    const { toJSON } = render(
      <SlippageModal
        isVisible
        dismiss={jest.fn()}
        onChange={jest.fn()}
        slippage={5}
      />,
    );
    expect(toJSON()).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    const { toJSON } = render(
      <SlippageModal
        isVisible={false}
        dismiss={jest.fn()}
        onChange={jest.fn()}
        slippage={1}
      />,
    );
    expect(toJSON()).toBeNull();
  });
});
