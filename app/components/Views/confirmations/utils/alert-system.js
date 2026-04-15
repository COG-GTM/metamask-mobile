
import { Severity } from '../types/alerts';
import { BannerAlertSeverity } from '../../../../component-library/components/Banners/Banner';

/**
 * Returns the style object based on the severity level.
 *
 * @param severity - The severity level of the alert.
 * @param colors - The theme colors object containing color definitions.
 * @returns An object containing the background and icon colors for the given severity.
 */
export const getSeverityStyle = (severity, colors) => {
  switch (severity) {
    case Severity.Warning:
      return {
        background: colors.warning.muted,
        icon: colors.warning.default
      };
    case Severity.Danger:
      return {
        background: colors.error.muted,
        icon: colors.error.default
      };
    default:
      return {
        background: colors.background.default,
        icon: colors.info.default
      };
  }
};

/**
 * Converts the severity of a banner alert to the corresponding BannerAlertSeverity.
 *
 * @param severity - The severity of the banner alert.
 * @returns The corresponding BannerAlertSeverity.
 */
export function getBannerAlertSeverity(
severity)
{
  switch (severity) {
    case Severity.Danger:
      return BannerAlertSeverity.Error;
    case Severity.Warning:
      return BannerAlertSeverity.Warning;
    default:
      return BannerAlertSeverity.Info;
  }
}