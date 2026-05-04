import React, { ReactNode } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { strings } from '../../../../../../../locales/i18n';
import Alert, { AlertType } from '../../../../../Base/Alert';
import Text from '../../../../../Base/Text';
import { CommonSelectorsIDs } from '../../../../../../../e2e/selectors/Common.selectors';

const styles = StyleSheet.create({
  button: {
    marginTop: 27,
    marginBottom: 12,
  },
  errorMessage: {
    flex: 0,
  },
});

interface ErrorMessageProps {
  errorMessage?: ReactNode;
  errorContinue?: boolean;
  onContinue?: () => void;
  isOnlyWarning?: boolean;
}

export default function ErrorMessage({
  errorMessage,
  errorContinue,
  onContinue,
  isOnlyWarning,
}: ErrorMessageProps) {
  return (
    <Alert type={isOnlyWarning ? AlertType.Info : AlertType.Error}>
      {(textStyle: Record<string, unknown>) => (
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
