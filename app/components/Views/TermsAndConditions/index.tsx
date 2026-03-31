import React, { PureComponent } from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';
import { ThemeContext, mockTheme } from '../../../util/theme';
import generateTestId from '../../../../wdio/utils/generateTestId';
import { TERMS_AND_CONDITIONS_BUTTON_ID } from '../../../../wdio/screen-objects/testIDs/Components/TermsAndConditions.testIds';

// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createStyles = (colors: any) =>
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

/**
 * View that is displayed in the flow to agree terms and conditions
 */
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TermsAndConditionsProps {
  navigation?: any;
  [key: string]: any;
}

export default class TermsAndConditions extends PureComponent<TermsAndConditionsProps> {

  press = () => {
    const { navigation } = this.props;
    navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: {
        url: AppConstants.URLS.TERMS_AND_CONDITIONS,
        title: strings('terms_and_conditions.title'),
      },
    });
  };

  render() {
    // TODO: Replace "any" with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const colors = (this.context as any).colors || mockTheme.colors;
    const styles = createStyles(colors);

    return (
      <TouchableOpacity
        {...generateTestId(Platform, TERMS_AND_CONDITIONS_BUTTON_ID)}
        onPress={this.press}
      >
        <Text style={styles.text}>
          {strings('terms_and_conditions.description')}
          <Text style={styles.link}>
            {strings('terms_and_conditions.terms')}
          </Text>
          .
        </Text>
      </TouchableOpacity>
    );
  }
}

TermsAndConditions.contextType = ThemeContext;
