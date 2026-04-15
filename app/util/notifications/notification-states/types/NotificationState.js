import {
  TRIGGER_TYPES } from

'@metamask/notification-services-controller/notification-services';
import { strings } from '../../../../../locales/i18n';





























const isSent = (
n) =>





n.type === TRIGGER_TYPES.ETH_SENT ||
n.type === TRIGGER_TYPES.ERC20_SENT ||
n.type === TRIGGER_TYPES.ERC721_SENT ||
n.type === TRIGGER_TYPES.ERC1155_SENT;

export const label_address_from = (n) =>
isSent(n) ?
strings('notifications.modal.label_address_from_you') :
strings('notifications.modal.label_address_from');

export const label_address_to = (n) =>
isSent(n) ?
strings('notifications.modal.label_address_to') :
strings('notifications.modal.label_address_to_you');