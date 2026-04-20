// Third party dependencies.
import React from 'react';
import { Text as RNText } from 'react-native';
import { render } from '@testing-library/react-native';

// Internal dependencies.
import BottomSheet from './BottomSheet';
import type { BottomSheetRef } from './BottomSheet.types';

const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: mockGoBack }),
}));

describe('BottomSheet', () => {
  beforeEach(() => {
    mockGoBack.mockReset();
  });

  it('renders children and matches snapshot', () => {
    const { toJSON, getByText } = render(
      <BottomSheet>
        <RNText>Content</RNText>
      </BottomSheet>,
    );
    expect(getByText('Content')).toBeTruthy();
    expect(toJSON()).toMatchSnapshot();
  });

  it('exposes imperative open and close methods via ref', () => {
    const ref = React.createRef<BottomSheetRef>();
    render(
      <BottomSheet ref={ref}>
        <RNText>Content</RNText>
      </BottomSheet>,
    );
    expect(typeof ref.current?.onOpenBottomSheet).toBe('function');
    expect(typeof ref.current?.onCloseBottomSheet).toBe('function');
  });
});
