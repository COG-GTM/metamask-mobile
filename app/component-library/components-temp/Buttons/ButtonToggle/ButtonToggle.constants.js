/* eslint-disable import/prefer-default-export */

// External dependencies.
import {
  DEFAULT_BUTTONBASE_LABEL_TEXTVARIANT,
  SAMPLE_BUTTONBASE_PROPS } from
'../../../components/Buttons/Button/foundation/ButtonBase/ButtonBase.constants';
import { TextColor } from '../../../components/Texts/Text';

// Internal dependencies.


// Defaults
export const DEFAULT_BUTTONTOGGLE_LABEL_TEXTVARIANT =
DEFAULT_BUTTONBASE_LABEL_TEXTVARIANT;
export const DEFAULT_BUTTONTOGGLE_LABEL_COLOR = TextColor.Default;
export const DEFAULT_BUTTONTOGGLE_LABEL_COLOR_ACTIVE = TextColor.Primary;

// Samples
export const SAMPLE_BUTTONTOGGLE_PROPS = {
  ...SAMPLE_BUTTONBASE_PROPS,
  isActive: false
};