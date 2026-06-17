import React, { PureComponent } from 'react';
import { Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import {
  NavigationProp,
  ParamListBase,
} from '@react-navigation/native';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import AppConstants from '../../../core/AppConstants';
import { ThemeContext, mockTheme } from '../../../util/theme';
import { Colors, Theme } from '../../../util/theme/models';
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

/**
 * View that is displayed in the flow to agree terms and conditions
 */
interface TermsAndConditionsProps {
  /**
   * navigation object required to push and pop other views
   */
  navigation: NavigationProp<ParamListBase>;
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
    const colors =
      (this.context as unknown as Theme).colors || mockTheme.colors;
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
