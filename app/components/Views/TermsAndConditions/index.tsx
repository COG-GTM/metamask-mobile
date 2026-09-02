import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';
import { useTheme } from '../../../util/theme';
import { Colors } from '../../../util/theme/models';
import generateTestId from '../../../../wdio/utils/generateTestId';
import { TERMS_AND_CONDITIONS_BUTTON_ID } from '../../../../wdio/screen-objects/testIDs/Components/TermsAndConditions.testIds';

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    text: {
      ...fontStyles.normal,
      color: colors.text.alternative,
      textAlign: 'center',
      fontSize: 10,
    },
    link: {
      textDecorationLine: 'underline',
    },
  });

interface TermsAndConditionsProps {
  /**
   * navigation object required to push and pop other views
   */
  navigation?: NavigationProp<ParamListBase>;
}

/**
 * View that is displayed in the flow to agree terms and conditions
 */
const TermsAndConditions = ({ navigation }: TermsAndConditionsProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  const press = () => {
    navigation?.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: AppConstants.URLS.TERMS_AND_CONDITIONS,
        title: strings('terms_and_conditions.title'),
      },
    });
  };

  return (
    <TouchableOpacity
      {...generateTestId(Platform, TERMS_AND_CONDITIONS_BUTTON_ID)}
      onPress={press}
    >
      <Text style={styles.text}>
        {strings('terms_and_conditions.description')}
        <Text style={styles.link}>{strings('terms_and_conditions.terms')}</Text>
        .
      </Text>
    </TouchableOpacity>
  );
};

export default TermsAndConditions;
