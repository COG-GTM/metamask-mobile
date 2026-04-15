import {

  createOnChainPushNotificationMessage } from
'@metamask/notification-services-controller/push-services';

import { strings } from '../../../../../locales/i18n';












const t = (name, params) =>
strings(name, params) ?? '';

const translations = {
  pushPlatformNotificationsFundsSentTitle: () =>
  t('notifications.push_notification_content.funds_sent_title'),
  pushPlatformNotificationsFundsSentDescriptionDefault: () =>
  t('notifications.push_notification_content.funds_sent_default_description'),
  pushPlatformNotificationsFundsSentDescription: (amount, symbol) =>
  t('notifications.push_notification_content.funds_sent_description', {
    amount,
    symbol
  }),
  pushPlatformNotificationsFundsReceivedTitle: () =>
  t('notifications.push_notification_content.funds_received_title'),
  pushPlatformNotificationsFundsReceivedDescriptionDefault: () =>
  t(
    'notifications.push_notification_content.funds_received_default_description'
  ),
  pushPlatformNotificationsFundsReceivedDescription: (amount, symbol) =>
  t('notifications.push_notification_content.funds_received_description', {
    amount,
    symbol
  }),
  pushPlatformNotificationsSwapCompletedTitle: () =>
  t('notifications.metamask_swap_completed_title'),
  pushPlatformNotificationsSwapCompletedDescription: () =>
  t(
    'notifications.push_notification_content.metamask_swap_completed_description'
  ),
  pushPlatformNotificationsNftSentTitle: () =>
  t('notifications.push_notification_content.nft_sent_title'),
  pushPlatformNotificationsNftSentDescription: () =>
  t('notifications.push_notification_content.nft_sent_description'),
  pushPlatformNotificationsNftReceivedTitle: () =>
  t('notifications.push_notification_content.nft_received_title'),
  pushPlatformNotificationsNftReceivedDescription: () =>
  t('notifications.push_notification_content.nft_received_description'),
  pushPlatformNotificationsStakingRocketpoolStakeCompletedTitle: () =>
  t('notifications.rocketpool_stake_completed_title'),
  pushPlatformNotificationsStakingRocketpoolStakeCompletedDescription: () =>
  t(
    'notifications.push_notification_content.rocketpool_stake_completed_description'
  ),
  pushPlatformNotificationsStakingRocketpoolUnstakeCompletedTitle: () =>
  t('notifications.rocketpool_unstake_completed_title'),
  pushPlatformNotificationsStakingRocketpoolUnstakeCompletedDescription: () =>
  t(
    'notifications.push_notification_content.rocketpool_unstake_completed_description'
  ),
  pushPlatformNotificationsStakingLidoStakeCompletedTitle: () =>
  t('notifications.lido_stake_completed_title'),
  pushPlatformNotificationsStakingLidoStakeCompletedDescription: () =>
  t(
    'notifications.push_notification_content.lido_stake_completed_description'
  ),
  pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnTitle: () =>
  t('notifications.lido_stake_ready_to_be_withdrawn_title'),
  pushPlatformNotificationsStakingLidoStakeReadyToBeWithdrawnDescription: () =>
  t(
    'notifications.push_notification_content.lido_stake_ready_to_be_withdrawn_description'
  ),
  pushPlatformNotificationsStakingLidoWithdrawalRequestedTitle: () =>
  t('notifications.lido_withdrawal_requested_title'),
  pushPlatformNotificationsStakingLidoWithdrawalRequestedDescription: () =>
  t(
    'notifications.push_notification_content.lido_withdrawal_requested_description'
  ),
  pushPlatformNotificationsStakingLidoWithdrawalCompletedTitle: () =>
  t('notifications.lido_withdrawal_completed_title'),
  pushPlatformNotificationsStakingLidoWithdrawalCompletedDescription: () =>
  t(
    'notifications.push_notification_content.lido_withdrawal_completed_description'
  )
};

export function createNotificationMessage(notification) {
  return createOnChainPushNotificationMessage(notification, translations);
}