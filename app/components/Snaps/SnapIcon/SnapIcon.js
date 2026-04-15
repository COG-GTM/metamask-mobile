import React from 'react';
import { useSelector } from 'react-redux';
import { IconSize } from '../../../component-library/components/Icons/Icon';
import { getAvatarFallbackLetter } from '../SnapUIRenderer/utils';
import AvatarBase from '../../../component-library/components/Avatars/Avatar/foundation/AvatarBase';
import AvatarFavicon from '../../../component-library/components/Avatars/Avatar/variants/AvatarFavicon';

import Text from '../../../component-library/components/Texts/Text';

import { selectTargetSubjectMetadata } from '../../../selectors/snaps/permissionController';
import { StyleSheet } from 'react-native';
import {

  JustifyContent,
  AlignItems } from
'../../UI/Box/box.types';

const styles = StyleSheet.create({
  icon: {
    borderRadius: 50,
    borderWidth: 0,
    width: 24,
    height: 24,
    alignItems: AlignItems.center,
    justifyContent: JustifyContent.center
  }
});









export const SnapIcon = ({
  snapId,
  avatarSize = IconSize.Lg,
  ...props
}) => {
  const subjectMetadata = useSelector((state) =>
  selectTargetSubjectMetadata(state, snapId)
  );

  const iconUrl = subjectMetadata.iconUrl;
  const snapName = subjectMetadata.name ?? undefined;

  // We choose the first non-symbol char as the fallback icon.
  const fallbackIcon = getAvatarFallbackLetter(snapName);

  return iconUrl ?
  <AvatarFavicon
    {...props}
    imageSource={{ uri: iconUrl }}
    size={avatarSize} /> :


  <AvatarBase
    style={styles.icon}
    {...props}
    size={avatarSize}>
    
      <Text>{fallbackIcon}</Text>
    </AvatarBase>;

};