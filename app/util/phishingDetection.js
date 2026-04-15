import {



  RecommendedAction } from
'@metamask/phishing-controller';
import Engine from '../core/Engine';
import { store } from '../store';
import { selectProductSafetyDappScanningEnabled } from '../selectors/featureFlagController/productSafetyDappScanning';

/**
 * Checks if product safety dapp scanning is enabled
 * @returns {boolean} Whether product safety dapp scanning is enabled
 */
export const isProductSafetyDappScanningEnabled = () =>
selectProductSafetyDappScanningEnabled(store.getState());

/**
 * Gets detailed phishing test results for an origin
 * @param {string} origin - URL origin or hostname to check
 * @returns {PhishingDetectorResult} Phishing test result object or null if protection is disabled
 * @deprecated Use getPhishingTestResultAsync instead. This function will be removed in a future release.
 */
export const getPhishingTestResult = (
origin) =>
{
  const { PhishingController } = Engine.context;


  PhishingController.maybeUpdateState();
  return PhishingController.test(origin);
};

/**
 * Gets detailed phishing test results for an origin
 * @param {string} origin - URL origin or hostname to check
 * @returns {PhishingDetectorResult} Phishing test result object - result is true if the site is UNSAFE
 */
export const getPhishingTestResultAsync = async (
origin) =>
{
  const { PhishingController } = Engine.context;



  if (isProductSafetyDappScanningEnabled()) {
    const scanResult = await PhishingController.scanUrl(origin);
    return {
      // result is true if site is UNSAFE (Block action)
      result:
      scanResult.recommendedAction !== RecommendedAction.None &&
      scanResult.recommendedAction !== RecommendedAction.Warn,
      name: 'Product safety dapp scanning is enabled',
      type: 'DAPP_SCANNING'
    };
  }

  PhishingController.maybeUpdateState();
  const result = PhishingController.test(origin);
  // Return the raw result from EPD - result is true if site is UNSAFE
  return result;
};