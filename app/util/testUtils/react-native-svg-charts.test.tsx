import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';
import { fireLayoutEvent } from './react-native-svg-charts';

describe('fireLayoutEvent', () => {
  it('fires onLayout handlers with the provided width/height options', () => {
    const onLayoutA = jest.fn();
    const onLayoutB = jest.fn();
    const { root } = render(
      <View>
        <View testID="a" onLayout={onLayoutA}>
          <View testID="b" onLayout={onLayoutB} />
        </View>
      </View>,
    );

    fireLayoutEvent(root, { width: 123, height: 45 });

    expect(onLayoutA).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { layout: { width: 123, height: 45 } },
      }),
    );
    expect(onLayoutB).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { layout: { width: 123, height: 45 } },
      }),
    );
  });

  it('uses default width=300 height=100 when options are omitted', () => {
    const onLayout = jest.fn();
    const { root } = render(<View onLayout={onLayout} />);

    fireLayoutEvent(root);

    expect(onLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        nativeEvent: { layout: { width: 300, height: 100 } },
      }),
    );
  });

  it('is a no-op when no component has an onLayout prop', () => {
    const { root } = render(<View />);
    expect(() => fireLayoutEvent(root)).not.toThrow();
  });
});
