/* eslint-disable dot-notation */
import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Image,
  Text,
  InteractionManager,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {
  getApplicationName,
  getVersion,
  getBuildNumber,
} from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';
import { fontStyles } from '../../../../styles/common';
import { strings } from '../../../../../locales/i18n';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import AppConstants from '../../../../core/AppConstants';
import { useTheme } from '../../../../util/theme';
import { Colors } from '../../../../util/theme/models';
import { AboutMetaMaskSelectorsIDs } from '../../../../../e2e/selectors/Settings/AboutMetaMask.selectors';

const IS_QA = process.env['METAMASK_ENVIRONMENT'] === 'qa';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
    },
    wrapperContent: {
      paddingLeft: 24,
      paddingRight: 24,
      paddingVertical: 24,
    },
    title: {
      fontSize: 18,
      textAlign: 'left',
      marginBottom: 20,
      ...fontStyles.normal,
      color: colors.text.default,
    },
    link: {
      fontSize: 18,
      textAlign: 'left',
      marginBottom: 20,
      ...fontStyles.normal,
      color: colors.primary.default,
    },
    division: {
      borderBottomColor: colors.border.muted,
      borderBottomWidth: 1,
      width: '30%',
      marginBottom: 20,
    },
    image: {
      width: 100,
      height: 100,
    },
    logoWrapper: {
      flex: 1,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
      top: 20,
      marginBottom: 40,
    },
    versionInfo: {
      marginTop: 20,
      fontSize: 18,
      textAlign: 'left',
      marginBottom: 20,
      color: colors.text.alternative,
      ...fontStyles.normal,
    },
    branchInfo: {
      fontSize: 18,
      textAlign: 'left',
      marginBottom: 20,
      color: colors.text.alternative,
      ...fontStyles.normal,
    },
  });

// eslint-disable-next-line import/no-commonjs, @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const foxImage = require('../../../../images/branding/fox.png');

/**
 * View that contains app information
 */
const AppInformation = () => {
  const { colors } = useTheme();
  // TODO: Replace "any" with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useNavigation<any>();
  const styles = createStyles(colors);

  const [appInfo, setAppInfo] = useState('');
  const [appVersion, setAppVersion] = useState('');

  const updateNavBar = useCallback(() => {
    navigation.setOptions(
      getNavigationOptionsTitle(
        strings('app_settings.info_title'),
        navigation,
        false,
        colors,
      ),
    );
  }, [navigation, colors]);

  useEffect(() => {
    updateNavBar();
  }, [updateNavBar]);

  useEffect(() => {
    const loadAppInfo = async () => {
      const appName = await getApplicationName();
      const version = await getVersion();
      const buildNumber = await getBuildNumber();
      setAppInfo(`${appName} v${version} (${buildNumber})`);
      setAppVersion(version);
    };
    loadAppInfo();
  }, []);

  const goTo = useCallback(
    (url: string, title: string) => {
      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('Webview', {
          screen: 'SimpleWebview',
          params: {
            url,
            title,
          },
        });
      });
    },
    [navigation],
  );

  const onPrivacyPolicy = useCallback(() => {
    const url = AppConstants.URLS.PRIVACY_POLICY;
    goTo(url, strings('app_information.privacy_policy'));
  }, [goTo]);

  const onTermsOfUse = useCallback(() => {
    const url = AppConstants.URLS.TERMS_AND_CONDITIONS;
    goTo(url, strings('app_information.terms_of_use'));
  }, [goTo]);

  const onAttributions = useCallback(() => {
    const url = `https://raw.githubusercontent.com/MetaMask/metamask-mobile/v${appVersion}/attribution.txt`;
    goTo(url, strings('app_information.attributions'));
  }, [goTo, appVersion]);

  const onSupportCenter = useCallback(() => {
    const url = 'https://support.metamask.io';
    goTo(url, strings('drawer.metamask_support'));
  }, [goTo]);

  const onWebSite = useCallback(() => {
    const url = 'https://metamask.io/';
    goTo(url, 'metamask.io');
  }, [goTo]);

  const onContactUs = useCallback(() => {
    const url = 'https://support.metamask.io';
    goTo(url, strings('drawer.metamask_support'));
  }, [goTo]);

  return (
    <SafeAreaView
      style={styles.wrapper}
      testID={AboutMetaMaskSelectorsIDs.CONTAINER}
    >
      <ScrollView contentContainerStyle={styles.wrapperContent}>
        <View style={styles.logoWrapper}>
          <Image
            source={foxImage}
            style={styles.image}
            resizeMethod={'auto'}
          />
          <Text style={styles.versionInfo}>{appInfo}</Text>
          {IS_QA ? (
            <Text style={styles.branchInfo}>
              {`Branch: ${process.env['GIT_BRANCH']}`}
            </Text>
          ) : null}
        </View>
        <Text style={styles.title}>{strings('app_information.links')}</Text>
        <View>
          <TouchableOpacity onPress={onPrivacyPolicy}>
            <Text style={styles.link}>
              {strings('app_information.privacy_policy')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onTermsOfUse}>
            <Text style={styles.link}>
              {strings('app_information.terms_of_use')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAttributions}>
            <Text style={styles.link}>
              {strings('app_information.attributions')}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.division} />
        <View>
          <TouchableOpacity onPress={onSupportCenter}>
            <Text style={styles.link}>
              {strings('app_information.support_center')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onWebSite}>
            <Text style={styles.link}>
              {strings('app_information.web_site')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onContactUs}>
            <Text style={styles.link}>
              {strings('app_information.contact_us')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AppInformation;
