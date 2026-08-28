declare module 'react-native-progress/Bar' {
  import React from 'react';
  import { BarPropTypes } from 'react-native-progress';

  /**
   * Standalone `Bar` entry point. The upstream types declare `width` as
   * `number`, but the implementation accepts `null` to enable automatic
   * flexbox sizing.
   */
  export default class Bar extends React.Component<
    Omit<BarPropTypes, 'width'> & { width?: number | null }
  > {}
}
