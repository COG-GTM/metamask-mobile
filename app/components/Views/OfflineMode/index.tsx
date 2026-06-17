'use strict';
import React from 'react';
import { SafeAreaView, Image, View, StyleSheet } from 'react-native';
import Text from '../../Base/Text';
import NetInfo from '@react-native-community/netinfo';
import { ParamListBase } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { baseStyles, fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import StyledButton from '../../UI/StyledButton';
import { getOfflineModalNavbar } from '../../UI/Navbar';
import AndroidBackHandler from '../AndroidBackHandler';
import Device from '../../../util/device';
import AppConstants from '../../../core/AppConstants';
import { connect } from 'react-redux';
import { getInfuraBlockedSelector } from '../../../reducers/infuraAvailability';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import { RootState } from '../../../reducers';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.default,
    },
    frame: {
      width: 200,
      height: 200,
      alignSelf: 'center',
      marginTop: 60,
    },
    content: {
      flex: 1,
      marginHorizontal: 18,
      justifyContent: 'center',
      marginVertical: 30,
    },
    title: {
      fontSize: 18,
      color: colors.text.default,
      marginBottom: 10,
      ...fontStyles.bold,
    },
    text: {
      fontSize: 12,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    buttonContainer: {
      marginHorizontal: 18,
    },
  });

// eslint-disable-next-line import/no-commonjs, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const astronautImage = require('../../../images/astronaut.png');

interface OfflineModeProps {
  /**
   * Object that represents the navigator
   */
  navigation: StackNavigationProp<ParamListBase>;
  /**
   * Whether infura was blocked or not
   */
  infuraBlocked: boolean;
}

const OfflineMode = ({ navigation, infuraBlocked }: OfflineModeProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const netinfo = NetInfo.useNetInfo();

  const tryAgain = () => {
    if (netinfo?.isConnected) {
      navigation.pop();
    }
  };

  const learnMore = () => {
    navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: { url: AppConstants.URLS.CONNECTIVITY_ISSUES },
    });
  };

  const action = () => {
    if (infuraBlocked) {
      learnMore();
    } else {
      tryAgain();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={astronautImage} style={styles.frame} />
      <View style={styles.content}>
        <View style={baseStyles.flexGrow}>
          <Text bold centered style={styles.title}>
            {strings('offline_mode.title')}
          </Text>
          <Text centered style={styles.text}>
            {strings(`offline_mode.text`)}
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <StyledButton type={'blue'} onPress={action}>
            {strings(
              `offline_mode.${infuraBlocked ? 'learn_more' : 'try_again'}`,
            )}
          </StyledButton>
        </View>
      </View>
      {Device.isAndroid() && <AndroidBackHandler customBackPress={tryAgain} />}
    </SafeAreaView>
  );
};

(
  OfflineMode as React.FC<OfflineModeProps> & {
    navigationOptions: (props: { navigation: unknown }) => unknown;
  }
).navigationOptions = ({ navigation }) =>
  (getOfflineModalNavbar as (navigation: unknown) => unknown)(navigation);

const mapStateToProps = (state: RootState) => ({
  infuraBlocked: getInfuraBlockedSelector(state),
});

export default connect(mapStateToProps)(OfflineMode);
