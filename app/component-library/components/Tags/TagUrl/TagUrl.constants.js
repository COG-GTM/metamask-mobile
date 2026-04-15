/* eslint-disable no-console */
/* eslint-disable import/prefer-default-export */
// Internal dependencies.


// External dependencies.
import { IconName } from '../../Icons/Icon';

// Sample consts
export const SAMPLE_TAGURL_PROPS = {
  imageSource: { uri: 'https://uniswap.org/favicon.ico' },
  label: 'https://uniswap.org',
  cta: {
    label: 'CTA Label',
    onPress: () => console.log('CTA pressed')
  },
  iconName: IconName.Add
};