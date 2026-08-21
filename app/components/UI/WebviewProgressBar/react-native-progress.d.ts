declare module 'react-native-progress/Bar' {
  import { ComponentType } from 'react';
  import { BarPropTypes } from 'react-native-progress';

  /**
   * `width` accepts `null` to fall back to automatic flexbox sizing, which the
   * package types do not describe.
   */
  const Bar: ComponentType<
    Omit<BarPropTypes, 'width'> & { width?: number | null }
  >;
  export default Bar;
}
