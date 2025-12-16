import React, { PureComponent } from 'react';
import {
  TouchableOpacity,
  ScrollView,
  Text,
  View,
  StyleSheet,
  InteractionManager,
  BackHandler,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { fontStyles } from '../../../styles/common';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { strings } from '../../../../locales/i18n';
import Device from '../../../util/device';
import { ScreenshotDeterrent } from '../../UI/ScreenshotDeterrent';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { SuccessImportAccountIDs } from '../../../../e2e/selectors/ImportAccount/SuccessImportAccount.selectors';
import { Theme } from '../../../util/theme/models';

interface Styles {
  mainWrapper: ViewStyle;
  wrapper: ViewStyle;
  content: ViewStyle;
  title: TextStyle;
  dataRow: ViewStyle;
  label: TextStyle;
  icon: TextStyle;
  top: ViewStyle;
  navbarRightButton: ViewStyle;
  closeIcon: TextStyle;
}

const createStyles = (colors: Theme['colors']): Styles =>
  StyleSheet.create({
    mainWrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    wrapper: {
      flex: 1,
    },
    content: {
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 32,
      marginTop: 10,
      marginBottom: 20,
      color: colors.text.default,
      justifyContent: 'center',
      textAlign: 'left',
      ...fontStyles.normal,
    },
    dataRow: {
      marginBottom: 10,
    },
    label: {
      fontSize: 16,
      lineHeight: 23,
      color: colors.text.default,
      textAlign: 'left',
      ...fontStyles.normal,
    },
    icon: {
      textAlign: 'left',
      fontSize: 90,
      marginTop: 0,
      marginLeft: 0,
    },
    top: {
      paddingTop: 0,
      padding: 30,
    },
    navbarRightButton: {
      alignSelf: 'flex-end',
      paddingHorizontal: 22,
      paddingTop: 20,
      paddingBottom: 10,
      marginTop: Device.isIphoneX() ? 40 : 20,
    },
    closeIcon: {
      fontSize: 28,
      color: colors.text.default,
    },
  });

interface NavigationObject {
  popToTop: () => void;
  canGoBack: () => boolean;
  goBack: (key: null) => void;
}

interface ImportPrivateKeySuccessProps {
  navigation: NavigationObject;
}

/**
 * View that's displayed the first time imports account
 */
class ImportPrivateKeySuccess extends PureComponent<ImportPrivateKeySuccessProps> {
  declare context: React.ContextType<typeof ThemeContext>;

  componentDidMount = () => {
    InteractionManager.runAfterInteractions(() => {
      BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
    });
  };

  componentWillUnmount = () => {
    InteractionManager.runAfterInteractions(() => {
      BackHandler.removeEventListener(
        'hardwareBackPress',
        this.handleBackPress,
      );
    });
  };

  handleBackPress = (): boolean => {
    this.props.navigation.popToTop();
    return true;
  };

  dismiss = () => {
    const { popToTop, canGoBack, goBack } = this.props.navigation;
    popToTop();
    canGoBack() && goBack(null);
  };

  render() {
    const colors = this.context?.colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <View style={styles.mainWrapper}>
        <ScrollView
          contentContainerStyle={styles.wrapper}
          style={styles.mainWrapper}
        >
          <View
            style={styles.content}
            testID={
              SuccessImportAccountIDs.CONTAINER
            }
          >
            <TouchableOpacity
              onPress={this.dismiss}
              style={styles.navbarRightButton}
              testID={
                SuccessImportAccountIDs.CLOSE_BUTTON
              }
            >
              <MaterialIcon name="close" size={15} style={styles.closeIcon} />
            </TouchableOpacity>
            <View style={styles.top}>
              <Icon
                name="checkmark-circle-outline"
                style={styles.icon}
                color={colors.success.default}
              />
              <Text style={styles.title}>
                {strings('import_private_key_success.title')}
              </Text>
              <View style={styles.dataRow}>
                <Text style={styles.label}>
                  {strings('import_private_key_success.description_one')}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
        <ScreenshotDeterrent enabled isSRP={false} />
      </View>
    );
  }
}

ImportPrivateKeySuccess.contextType = ThemeContext;

export default ImportPrivateKeySuccess;
