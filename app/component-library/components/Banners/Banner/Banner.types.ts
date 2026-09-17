// External dependencies.
import { BannerAlertProps } from './variants/BannerAlert/BannerAlert.types';

/**
 * Banner variant.
 */
export enum BannerVariant {
  Alert = 'Alert',
}

/**
 * Banner component props.
 */
export type BannerProps = BannerAlertProps & {
  /**
   * Variant of Banner.
   */
  variant: BannerVariant;
};
