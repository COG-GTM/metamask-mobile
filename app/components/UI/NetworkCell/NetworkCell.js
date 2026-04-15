import React from 'react';
import { Switch } from 'react-native';
import { useStyles } from '../../../component-library/hooks';
import Cell from '../../../component-library/components/Cells/Cell/Cell';
import { CellVariant } from '../../../component-library/components/Cells/Cell';
import { AvatarVariant } from '../../../component-library/components/Avatars/Avatar/Avatar.types';
import { useTheme } from '../../../util/theme';
import styleSheet from './NetworkCell.styles';















const NetworkCell = ({
  name,
  chainId,
  imageSource,
  secondaryText,
  showIncomingTransactionsNetworks,
  toggleEnableIncomingTransactions,
  testID
}) => {
  const { colors, brandColors } = useTheme();
  const { styles } = useStyles(styleSheet, {});

  return (
    <Cell
      variant={CellVariant.Display}
      title={name}
      avatarProps={{
        variant: AvatarVariant.Network,
        name,
        imageSource
      }}
      secondaryText={secondaryText}
      style={styles.cellBorder}>
      
      <Switch
        testID={testID}
        value={
        showIncomingTransactionsNetworks[
        chainId]

        }
        onValueChange={(value) =>
        toggleEnableIncomingTransactions(chainId, value)
        }
        trackColor={{
          true: colors.primary.default,
          false: colors.border.muted
        }}
        thumbColor={brandColors.white}
        style={styles.switch}
        ios_backgroundColor={colors.border.muted} />
      
    </Cell>);

};

export default NetworkCell;