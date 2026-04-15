import extractURLParams from './DeeplinkManager/ParseManager/extractURLParams';


import Logger from '../util/Logger';
import DevLogger from './SDKConnect/utils/DevLogger';

















export function processAttribution({ currentDeeplink, store }) {
  const { security } = store.getState();
  if (!security.dataCollectionForMarketing) {
    return undefined;
  }

  if (currentDeeplink) {
    const { params } = extractURLParams(currentDeeplink);
    const attributionId = params.attributionId || undefined;
    const utm = params.utm || undefined;
    let utm_source, utm_medium, utm_campaign, utm_term, utm_content;

    if (utm) {
      try {
        const utmParams = JSON.parse(utm);
        DevLogger.log('processAttribution:: UTM params', utmParams);
        utm_source = utmParams.source;
        utm_medium = utmParams.medium;
        utm_campaign = utmParams.campaign;
        utm_term = utmParams.term;
        utm_content = utmParams.content;
      } catch (error) {
        Logger.error(new Error('Error parsing UTM params'), error);
      }
    }

    return {
      attributionId,
      utm,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content
    };
  }

  return undefined;
}