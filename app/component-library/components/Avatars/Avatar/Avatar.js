/* eslint-disable react/prop-types */
import React from 'react';

// External dependencies.
import AvatarAccount from './variants/AvatarAccount';

import AvatarFavicon from './variants/AvatarFavicon';

import AvatarIcon from './variants/AvatarIcon';

import AvatarNetwork from './variants/AvatarNetwork';

import AvatarToken from './variants/AvatarToken';


// Internal dependencies.
import { AvatarVariant } from './Avatar.types';

const Avatar = ({ variant, ...props }) => {
  switch (variant) {
    case AvatarVariant.Account:
      return <AvatarAccount {...props} />;
    case AvatarVariant.Favicon:
      return <AvatarFavicon {...props} />;
    case AvatarVariant.Icon:
      return <AvatarIcon {...props} />;
    case AvatarVariant.Network:
      return <AvatarNetwork {...props} />;
    case AvatarVariant.Token:
      return <AvatarToken {...props} />;
    default:
      throw new Error('Invalid Avatar Variant');
  }
};

export default Avatar;