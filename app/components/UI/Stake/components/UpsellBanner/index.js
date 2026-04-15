import React from 'react';
import {
  UPSELL_BANNER_VARIANTS } from



'./UpsellBanner.types';
import UpsellBannerBody from './UpsellBannerBody';
import UpsellBannerHeader from './UpsellBannerHeader';

const UpsellBanner = ({
  variant = UPSELL_BANNER_VARIANTS.HEADER,
  ...props
}) => {
  switch (variant) {
    case UPSELL_BANNER_VARIANTS.BODY:
      return <UpsellBannerBody {...props} />;
    case UPSELL_BANNER_VARIANTS.HEADER:
    default:
      return <UpsellBannerHeader {...props} />;
  }
};

export default UpsellBanner;