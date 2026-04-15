import React from 'react';

import AnnouncementImageHeader from './AnnouncementImageHeader';
import NFTImageHeader from './NFTImageHeader';





export default function ModalHeader({ modalHeader }) {
  if (modalHeader.type === 'ModalHeader-AnnouncementImage')
  return <AnnouncementImageHeader {...modalHeader} />;

  if (modalHeader.type === 'ModalHeader-NFTImage')
  return <NFTImageHeader {...modalHeader} />;

  return null;
}