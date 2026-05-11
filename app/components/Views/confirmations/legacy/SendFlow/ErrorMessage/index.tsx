import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TextStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { strings } from '../../../../../../../locales/i18n';
import Alert, { AlertType } from '../../../../../Base/Alert';
import Text from '../../../../../Base/Text';
import { CommonSelectorsIDs } from '../../../../../../../e2e/selectors/Common.selectors';

const styles = StyleSheet.create<{
  button: ViewStyle;
  errorMessage: TextStyle;
}>({
  button: {
    marginTop: 27,
    marginBottom: 12,
  },
  errorMessage: {
    flex: 0,
  },
});

interface Props {
  /**
   * Error message to display, can be a string or a Text component
   */
  errorMessage?: React.ReactNode;
  /**
   * Show continue button when it is a contract address
   */
  errorContinue?: boolean;
  /**
   * Function that is called when continue button is pressed
   */
  onContinue?: () => void;
  /**
   * Show a warning info instead of an error
   */
  isOnlyWarning?: boolean;
}

export default function ErrorMessage(props: Props) {
  const { errorMessage, errorContinue, onContinue, isOnlyWarning } = props;
  return (
    <Alert type={isOnlyWarning ? AlertType.Info : AlertType.Error}>
      {(textStyle: StyleProp<TextStyle>) => (
        <View>
          <Text
            small
            style={[textStyle, styles.errorMessage]}
            testID={CommonSelectorsIDs.ERROR_MESSAGE}
          >
            {errorMessage}
          </Text>
          {errorContinue && (
            <TouchableOpacity onPress={onContinue} style={styles.button}>
              <Text small link centered>
                {strings('transaction.continueError')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </Alert>
  );
}
