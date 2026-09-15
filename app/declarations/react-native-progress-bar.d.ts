declare module 'react-native-progress/Bar' {
  import { Component } from 'react';
  import { BarPropTypes } from 'react-native-progress';

  export type ProgressBarProps = Omit<BarPropTypes, 'width'> & {
    /** Set to null to use automatic flexbox sizing. */
    width?: number | null;
  };

  export default class Bar extends Component<ProgressBarProps> {}
}
