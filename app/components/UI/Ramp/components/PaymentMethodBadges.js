import React from 'react';


import { useTheme } from '../../../../util/theme';
import RemoteImage from '../../../Base/RemoteImage';





const PaymentMethodBadges = ({
  logosByTheme,
  style
}) => {
  const { themeAppearance } = useTheme();

  const logos = logosByTheme[themeAppearance];

  return (
    <>
      {logos.map((logoURL) =>
      <RemoteImage key={logoURL} source={{ uri: logoURL }} style={style} />
      )}
    </>);

};

export default PaymentMethodBadges;