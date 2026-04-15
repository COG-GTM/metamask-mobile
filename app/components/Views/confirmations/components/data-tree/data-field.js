import React, { memo } from 'react';
import { isValidHexAddress } from '@metamask/utils';
import { StyleSheet, View } from 'react-native';
import { startCase } from 'lodash';

import { strings } from '../../../../../../locales/i18n';
import Text from '../../../../../component-library/components/Texts/Text';
import { NONE_DATE_VALUE } from '../../utils/date';
import {
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
  PrimaryType } from
'../../constants/signatures';
import Address from '../UI/info-row/info-value/address';
import InfoDate from '../UI/info-row/info-value/info-date';
import InfoRow from '../UI/info-row';
import TokenValue from '../UI/info-row/info-value/token-value';
import DataTree from './data-tree';var

Field = /*#__PURE__*/function (Field) {Field["Amount"] = "amount";Field["BuyAmount"] = "buyAmount";Field["Deadline"] = "deadline";Field["EndAmount"] = "endAmount";Field["EndTime"] = "endTime";Field["Expiration"] = "expiration";Field["Expiry"] = "expiry";Field["SellAmount"] = "sellAmount";Field["SigDeadline"] = "sigDeadline";Field["StartAmount"] = "startAmount";Field["StartTime"] = "startTime";Field["ValidTo"] = "validTo";Field["Value"] = "value";return Field;}(Field || {});















const FIELD_DATE_PRIMARY_TYPES = {
  [Field.Deadline]: [...PRIMARY_TYPES_PERMIT],
  [Field.EndTime]: [...PRIMARY_TYPES_ORDER],
  [Field.Expiration]: [PrimaryType.PermitBatch, PrimaryType.PermitSingle],
  [Field.Expiry]: [...PRIMARY_TYPES_PERMIT],
  [Field.SigDeadline]: [...PRIMARY_TYPES_PERMIT],
  [Field.StartTime]: [...PRIMARY_TYPES_ORDER],
  [Field.ValidTo]: [...PRIMARY_TYPES_ORDER]
};

const FIELD_TOKEN_UTILS_PRIMARY_TYPES = {
  [Field.Amount]: [...PRIMARY_TYPES_PERMIT],
  [Field.BuyAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.EndAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.SellAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.StartAmount]: [...PRIMARY_TYPES_ORDER],
  [Field.Value]: [...PRIMARY_TYPES_PERMIT]
};

function isDateField(label, primaryType) {
  return (FIELD_DATE_PRIMARY_TYPES[label] || [])?.includes(primaryType || '');
}

function isTokenValueField(label, primaryType) {
  return (FIELD_TOKEN_UTILS_PRIMARY_TYPES[label] || [])?.includes(
    primaryType || ''
  );
}

const createStyles = (depth) =>
StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: '100%',
    paddingLeft: depth > 0 ? 8 : 0
  },
  dataRow: {
    paddingHorizontal: 0,
    paddingBottom: 8
  }
});

const DataField = memo(
  ({
    chainId,
    depth,
    label,
    primaryType,
    type,
    tokenDecimals,
    value








  }) => {
    const styles = createStyles(depth);
    let fieldDisplay;
    if (type === 'address' && isValidHexAddress(value)) {
      fieldDisplay = <Address address={value} chainId={chainId} />;
    } else if (isDateField(label, primaryType) && Boolean(value)) {
      const intValue = parseInt(value, 10);

      fieldDisplay =
      intValue === NONE_DATE_VALUE ?
      <Text>{strings('confirm.none')}</Text> :

      <InfoDate unixTimestamp={parseInt(value, 10)} />;

    } else if (isTokenValueField(label, primaryType)) {
      fieldDisplay =
      <TokenValue
        label={startCase(label)}
        value={value}
        decimals={tokenDecimals} />;


    } else if (typeof value === 'object' && value !== null) {
      fieldDisplay =
      <DataTree
        data={value}
        chainId={chainId}
        depth={depth + 1}
        primaryType={primaryType}
        tokenDecimals={tokenDecimals} />;


    } else if (type === 'bool') {
      fieldDisplay = <Text>{value ? 'true' : 'false'}</Text>;
    } else {
      fieldDisplay = <Text>{value}</Text>;
    }
    return (
      <View style={styles.container}>
        <InfoRow label={startCase(label)} style={styles.dataRow}>
          {fieldDisplay}
        </InfoRow>
      </View>);

  }
);

export default DataField;