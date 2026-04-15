/* eslint-disable import/prefer-default-export */

// External dependencies.
import { SAMPLE_BUTTONSECONDARY_PROPS } from './variants/ButtonSecondary/ButtonSecondary.constants';

// Internal dependencies.
import { ButtonVariants } from './Button.types';

// Samples
export const SAMPLE_BUTTON_PROPS = {
  variant: ButtonVariants.Secondary,
  ...SAMPLE_BUTTONSECONDARY_PROPS
};