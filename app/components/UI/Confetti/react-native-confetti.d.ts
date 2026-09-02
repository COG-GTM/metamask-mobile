declare module 'react-native-confetti' {
  import { Component } from 'react';

  interface ConfettiViewProps {
    confettiCount?: number;
    timeout?: number;
    untilStopped?: boolean;
    duration?: number;
    colors?: string[];
    size?: number;
    bsize?: number;
  }

  export default class ConfettiView extends Component<ConfettiViewProps> {
    startConfetti(): void;
    stopConfetti(): void;
  }
}
