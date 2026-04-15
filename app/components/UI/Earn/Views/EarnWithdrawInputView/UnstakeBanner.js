import React from 'react';
import Text from '../../../../../component-library/components/Texts/Text';
import { strings } from '../../../../../../locales/i18n';
import {
  BannerVariant } from

'../../../../../component-library/components/Banners/Banner/Banner.types';
import Banner, {
  BannerAlertSeverity } from
'../../../../../component-library/components/Banners/Banner';



const UnstakeInputViewBanner = ({ style }) =>
<Banner
  severity={BannerAlertSeverity.Info}
  variant={BannerVariant.Alert}
  style={style}
  description={
  <Text>{strings('stake.unstake_input_banner_description')}</Text>
  } />;



export default UnstakeInputViewBanner;