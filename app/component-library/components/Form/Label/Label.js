/* eslint-disable react/prop-types */

// Third party dependencies.
import React from 'react';

// External dependencies.
import Text from '../../Texts/Text';

// Internal dependencies.

import { DEFAULT_LABEL_TEXT_VARIANT, LABEL_TEST_ID } from './Label.constants';

const Label = ({ ...props }) =>
<Text
  variant={DEFAULT_LABEL_TEXT_VARIANT}
  testID={LABEL_TEST_ID}
  {...props} />;



export default Label;