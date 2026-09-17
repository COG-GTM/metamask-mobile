/* eslint-disable react/display-name */
// Third party dependencies.
import React from 'react';

// External dependencies.
import { SAMPLE_BANNERALERT_PROPS } from './variants/BannerAlert/BannerAlert.constants';

// Internal dependencies.
import { BannerVariant } from './Banner.types';
import { default as BannerComponent } from './Banner';

const BannerMeta = {
  title: 'Component Library / Banners',
  component: BannerComponent,
  argTypes: {
    variant: {
      options: BannerVariant,
      control: {
        type: 'select',
      },
      defaultValue: BannerVariant.Alert,
    },
  },
};
export default BannerMeta;

export const Banner = {
  render: () => (
    <BannerComponent
      variant={BannerVariant.Alert}
      {...SAMPLE_BANNERALERT_PROPS}
    />
  ),
};
