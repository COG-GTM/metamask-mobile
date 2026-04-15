import React from 'react';

import Text from '../../../../../../../../component-library/components/Texts/Text';
import { formatUTCDateFromUnixTimestamp } from '../../../../../utils/date';





const InfoDate = ({ unixTimestamp }) =>
<Text>{formatUTCDateFromUnixTimestamp(unixTimestamp)}</Text>;


export default InfoDate;