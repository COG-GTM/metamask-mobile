import React from 'react';
import { useTheme } from '../../../util/theme';
import styles from './Title.styles';
import Text from '../../../component-library/components/Texts/Text';





const Title = ({
  centered,
  hero,
  style: externalStyle,
  ...props
}) => {
  const { colors } = useTheme();
  const style = styles(colors);

  return (
    <Text
      style={{
        ...style.text,
        ...(centered ? style.centered : {}),
        ...(hero ? style.hero : {}),
        ...(typeof externalStyle === 'object' ? externalStyle : {})
      }}
      {...props} />);


};

export default Title;