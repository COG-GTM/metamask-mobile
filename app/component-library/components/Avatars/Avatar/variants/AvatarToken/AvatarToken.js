// Third party dependencies.
import React, { useState } from 'react';
import { Image, ImageBackground } from 'react-native';
import { useSelector } from 'react-redux';

// External dependencies.
import { selectIsIpfsGatewayEnabled } from '../../../../../../selectors/preferencesController';
import { isIPFSUri } from '../../../../../../util/general';
import AvatarBase from '../../foundation/AvatarBase';
import Text from '../../../../Texts/Text';
import { useStyles } from '../../../../../hooks';
import { TEXTVARIANT_BY_AVATARSIZE } from '../../Avatar.constants';

// Internal dependencies.

import stylesheet from './AvatarToken.styles';
import {
  DEFAULT_AVATARTOKEN_SIZE,
  DEFAULT_AVATARTOKEN_ERROR_TEXT,
  AVATARTOKEN_IMAGE_TESTID } from
'./AvatarToken.constants';

const AvatarToken = ({
  size = DEFAULT_AVATARTOKEN_SIZE,
  style,
  name,
  imageSource,
  isHaloEnabled,
  isIpfsGatewayCheckBypassed = false,
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(!imageSource);

  const { styles } = useStyles(stylesheet, {
    style,
    size,
    isHaloEnabled,
    showFallback
  });
  let isIpfsGatewayEnabled = false;

  if (!isIpfsGatewayCheckBypassed) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    isIpfsGatewayEnabled = useSelector(selectIsIpfsGatewayEnabled);
  }

  const tokenNameFirstLetter = name?.[0] ?? DEFAULT_AVATARTOKEN_ERROR_TEXT;

  const onError = () => setShowFallback(true);

  const imageUri =
  imageSource && Image.resolveAssetSource(imageSource);
  const isIpfsDisabledAndUriIsIpfs = imageUri ?
  !isIpfsGatewayEnabled && isIPFSUri(imageUri.uri) :
  false;

  const tokenImage = () =>
  <AvatarBase size={size} style={styles.base} {...props}>
      {showFallback || isIpfsDisabledAndUriIsIpfs ?
    <Text style={styles.label} variant={TEXTVARIANT_BY_AVATARSIZE[size]}>
          {tokenNameFirstLetter}
        </Text> :

    <Image
      source={imageSource}
      style={styles.image}
      onError={onError}
      testID={AVATARTOKEN_IMAGE_TESTID}
      resizeMode={'contain'} />

    }
    </AvatarBase>;


  return !isHaloEnabled || showFallback || isIpfsDisabledAndUriIsIpfs ?
  tokenImage() :

  <ImageBackground
    blurRadius={20}
    style={styles.halo}
    imageStyle={styles.haloImage}
    source={imageSource}>
    
      {tokenImage()}
    </ImageBackground>;

};

export default AvatarToken;