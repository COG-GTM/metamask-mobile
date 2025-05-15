export interface FadeAnimationViewProps {
  /**
   * Component to render
   */
  children: React.ReactNode;
  /**
   * Style of the container view
   */
  style?: React.CSSProperties | React.CSSProperties[];
  /**
   * Time for the animation
   */
  animationTime?: number;
  /**
   * Value to watch for changes to start animation
   */
  valueToWatch?: string | number;
  /**
   * Function to call when update animation starts
   */
  onAnimationStart?: () => void;
  /**
   * Function to call when update animation ends
   */
  onAnimationEnd?: () => void;
  /**
   * If the values should animate upon update or not
   */
  animateOnChange?: boolean;
}
