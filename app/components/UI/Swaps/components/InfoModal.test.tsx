/* eslint-disable react/jsx-pascal-case, react/prop-types, @typescript-eslint/no-unused-vars, @typescript-eslint/no-require-imports, import/no-commonjs */
import React from 'react';
import { Text, View } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('react-native-modal', () => {
  const RN = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: ({
      isVisible,
      children,
    }: {
      isVisible?: boolean;
      children?: React.ReactNode;
    }) => (isVisible ? <RN.View>{children}</RN.View> : null),
  };
});

import InfoModal from './InfoModal';

describe('InfoModal', () => {
  it('matches snapshot when visible with title and body', () => {
    const { toJSON } = render(
      <InfoModal
        isVisible
        toggleModal={jest.fn()}
        title="Fee"
        body={<Text>Details</Text>}
        testID="info-modal"
      />,
    );
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders the title and body', () => {
    const { getByText } = render(
      <InfoModal
        isVisible
        toggleModal={jest.fn()}
        title="Fee"
        body={<Text>Details</Text>}
      />,
    );
    expect(getByText('Fee')).toBeTruthy();
    expect(getByText('Details')).toBeTruthy();
  });

  it('renders a link when message/urlText/url props are provided', () => {
    const url = jest.fn();
    const { getByText } = render(
      <InfoModal
        isVisible
        toggleModal={jest.fn()}
        message="hello"
        urlText="learn more"
        url={url}
      />,
    );
    expect(getByText('learn more')).toBeTruthy();
    fireEvent.press(getByText('learn more'));
    expect(url).toHaveBeenCalledTimes(1);
  });

  it('renders nothing in the modal surface when not visible', () => {
    const { queryByText } = render(
      <InfoModal
        isVisible={false}
        toggleModal={jest.fn()}
        title="Fee"
        body={<Text>Details</Text>}
      />,
    );
    expect(queryByText('Details')).toBeNull();
  });
});
