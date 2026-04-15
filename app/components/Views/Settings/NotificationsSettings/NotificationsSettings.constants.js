import { strings } from '../../../../../locales/i18n';

export const NotificationsViewSelectorsIDs = {
  [strings('app_settings.notifications_opts.assets_sent_title')]: 'AssetsSent',
  [strings('app_settings.notifications_opts.assets_received_title')]:
  'AssetsReceived',
  [strings('app_settings.notifications_opts.defi_title')]: 'Defi',
  [strings('app_settings.notifications_opts.snaps_title')]: 'Snaps',
  [strings('app_settings.notifications_opts.products_announcements_title')]:
  'ProductsAnnouncements'
};

export let NotificationsKinds = /*#__PURE__*/function (NotificationsKinds) {NotificationsKinds["SENT"] = "sent";NotificationsKinds["RECEIVED"] = "received";NotificationsKinds["STAKED"] = "staked";NotificationsKinds["SWAPED"] = "swaped";NotificationsKinds["DEFI"] = "defi";NotificationsKinds["SNAPS"] = "snaps";NotificationsKinds["BRIDGED"] = "bridged";NotificationsKinds["BOUGHT"] = "bought";NotificationsKinds["PRODUCTS_ANNOUNCEMENTS"] = "product-announcements";return NotificationsKinds;}({});