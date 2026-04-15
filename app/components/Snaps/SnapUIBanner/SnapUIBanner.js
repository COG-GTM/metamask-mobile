import React from 'react';
import Banner, {

  BannerVariant } from
'../../../component-library/components/Banners/Banner';







export const SnapUIBanner = ({
  children,
  severity,
  title
}) =>
<Banner severity={severity} title={title} variant={BannerVariant.Alert}>
    {children}
  </Banner>;