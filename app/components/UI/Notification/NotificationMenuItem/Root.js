import React from 'react';
import { TouchableOpacity } from 'react-native';
import useStyles from '../List/useStyles';







function NotificationRoot({
  children,
  handleOnPress,
  isRead,
  testID
}) {
  const { styles } = useStyles();

  return (
    <TouchableOpacity
      onPress={handleOnPress}
      style={[
      styles.menuItemContainer,
      !isRead ? styles.unreadItemContainer : styles.readItemContainer]
      }
      testID={testID}>
      
      {children}
    </TouchableOpacity>);

}

export default NotificationRoot;