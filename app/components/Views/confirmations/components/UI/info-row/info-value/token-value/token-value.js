
import React from 'react';

import {
  formatAmount,
  formatAmountMaxPrecision } from
'../../../../../../../UI/SimulationDetails/formatAmount';
import { calcTokenAmount } from '../../../../../../../../util/transactions';
import { shortenString } from '../../../../../../../../util/notifications';
import TextWithTooltip from '../../../text-with-tooltip';







const TokenValue = ({ label, decimals, value }) => {
  const tokenValue = calcTokenAmount(value, decimals);

  const tokenText = formatAmount('en-US', tokenValue);
  const tokenTextMaxPrecision = formatAmountMaxPrecision('en-US', tokenValue);

  return (
    <TextWithTooltip
      label={label}
      text={shortenString(tokenText, {
        truncatedCharLimit: 15,
        truncatedStartChars: 15,
        truncatedEndChars: 0,
        skipCharacterInEnd: true
      })}
      tooltip={tokenTextMaxPrecision} />);


};

export default TokenValue;