/* eslint-disable react/prop-types */

// Third library dependencies.
import React from 'react';

// External dependencies.
import { useStyles } from '../../../../../hooks';
import CellBase from '../../foundation/CellBase';
import Card from '../../../../Cards/Card';
import { CellComponentSelectorsIDs } from '../../../../../../../e2e/selectors/wallet/CellComponent.selectors';

// Internal dependencies.
import styleSheet from './CellDisplay.styles';


const CellDisplay = ({ style, ...props }) => {
  const { styles } = useStyles(styleSheet, { style });

  return (
    <Card style={styles.base} testID={CellComponentSelectorsIDs.DISPLAY} {...props}>
      <CellBase {...props} />
    </Card>);

};

export default CellDisplay;