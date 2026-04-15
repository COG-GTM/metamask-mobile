import React from 'react';

import AnnouncementCtaFooter from './AnnouncementCtaFooter';
import BlockExplorerFooter from './BlockExplorerFooter';







export default function ModalFooter({ modalFooter, notification }) {
  if (modalFooter.type === 'ModalFooter-BlockExplorer')
  return <BlockExplorerFooter {...modalFooter} notification={notification} />;

  if (modalFooter.type === 'ModalFooter-AnnouncementCta')
  return <AnnouncementCtaFooter {...modalFooter} />;

  return null;
}