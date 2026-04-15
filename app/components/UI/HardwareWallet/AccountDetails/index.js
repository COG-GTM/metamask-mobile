import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/EvilIcons';
import { renderFromWei } from '../../../../util/number';
import { useTheme } from '../../../../util/theme';
import EthereumAddress from '../../../UI/EthereumAddress';
import { createStyle } from './styles';









const AccountDetails = (props) => {
  const { colors } = useTheme();
  const styles = createStyle(colors);
  const { index, address, balance, ticker, toBlockExplorer } = props;
  const defaultTicker = 'ETH';

  return (
    <View style={styles.rowContainer}>
      <View style={styles.accountDetails}>
        <Text style={styles.index}>{index}</Text>
        <EthereumAddress
          style={styles.information}
          address={address}
          type={'short'} />
        
        <Text style={styles.information}>
          {renderFromWei(balance)} {ticker || defaultTicker}
        </Text>
      </View>
      {
      <Icon
        size={18}
        name={'external-link'}
        onPress={() => toBlockExplorer(address)}
        style={styles.linkIcon}
        color={colors.text.default} />

      }
    </View>);

};

export default React.memo(AccountDetails);