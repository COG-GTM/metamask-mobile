declare module 'react-native-confetti' {
  import { Component } from 'react';

  export interface ConfettiProps {
    confettiCount?: number;
    timeout?: number;
    duration?: number;
    colors?: string[];
    size?: number;
    bsize?: number;
    untilStopped?: boolean;
    [key: string]: unknown;
  }

  export default class Confetti extends Component<ConfettiProps> {
    startConfetti(): void;
    stopConfetti(): void;
  }
}
