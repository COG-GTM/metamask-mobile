declare module 'react-native-confetti' {
  import { Component } from 'react';

  export interface ConfettiViewProps {
    confettiCount?: number;
    timeout?: number;
    untilStopped?: boolean;
    startOnLoad?: boolean;
    colors?: string[];
    size?: number;
    bsize?: number;
    duration?: number;
  }

  export default class ConfettiView extends Component<ConfettiViewProps> {
    startConfetti(onComplete?: () => void): void;
    stopConfetti(): void;
  }
}
