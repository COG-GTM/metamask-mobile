// external dependencies
import React, { useMemo } from 'react';
import Text from '../Text/Text';

// internal dependencies
import { SensitiveTextLength } from './SensitiveText.types';

const SensitiveText = ({
  isHidden = false,
  children = '',
  length = SensitiveTextLength.Short,
  ...props
}) => {
  const getFallbackLength = useMemo(
    () => (len) => {
      const numLength = Number(len);
      return Number.isNaN(numLength) ? 0 : numLength;
    },
    []
  );

  const isValidCustomLength = (value) => {
    const num = Number(value);
    return !Number.isNaN(num) && num > 0;
  };

  if (!(length in SensitiveTextLength) && !isValidCustomLength(length)) {
    console.warn(`Invalid length provided: ${length}. Falling back to Short.`);
    length = SensitiveTextLength.Short;
  }

  const fallback = useMemo(
    () => '•'.repeat(getFallbackLength(length)),
    [length, getFallbackLength]
  );
  return <Text {...props}>{isHidden ? fallback : children}</Text>;
};

export default SensitiveText;