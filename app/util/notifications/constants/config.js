import Engine from '../../../core/Engine';
import { isE2E } from '../../test/utils';

/**
 * This feature flag compromises of a build-time flag as well as a remote flag.
 * NOTE: this does not use the remote flag redux selectors, so UI is prone to being stale.
 * - This is okay in our case as we make this function call on all notification actions.
 *
 * @returns boolean if notifications feature is enabled.
 */
export const isNotificationsFeatureEnabled = () => {
  if (isE2E) {
    return true;
  }

  const notificationsRemoteFlagEnabled = Boolean(
    Engine?.context?.RemoteFeatureFlagController?.state?.remoteFeatureFlags?.
    assetsNotificationsEnabled
  );

  return (
    process.env.MM_NOTIFICATIONS_UI_ENABLED === 'true' &&
    notificationsRemoteFlagEnabled);

};

export let ModalFieldType = /*#__PURE__*/function (ModalFieldType) {ModalFieldType["ASSET"] = "ModalField-Asset";ModalFieldType["ADDRESS"] = "ModalField-Address";ModalFieldType["ANNOUNCEMENT_DESCRIPTION"] = "ModalField-AnnouncementDescription";ModalFieldType["TRANSACTION"] = "ModalField-Transaction";ModalFieldType["STAKING_PROVIDER"] = "ModalField-StakingProvider";ModalFieldType["NETWORK_FEE"] = "ModalField-NetworkFee";ModalFieldType["NETWORK"] = "ModalField-Network";ModalFieldType["NFT_IMAGE"] = "ModalField-NFTImage";ModalFieldType["NFT_COLLECTION_IMAGE"] = "ModalField-NFTCollectionImage";ModalFieldType["SWAP_RATE"] = "ModalField-SwapsRate";return ModalFieldType;}({});












export let ModalFooterType = /*#__PURE__*/function (ModalFooterType) {ModalFooterType["BLOCK_EXPLORER"] = "ModalFooter-BlockExplorer";ModalFooterType["ANNOUNCEMENT_CTA"] = "ModalFooter-AnnouncementCta";return ModalFooterType;}({});




export let ModalHeaderType = /*#__PURE__*/function (ModalHeaderType) {ModalHeaderType["NFT_IMAGE"] = "ModalHeader-NFTImage";ModalHeaderType["ANNOUNCEMENT_IMAGE"] = "ModalHeader-AnnouncementImage";return ModalHeaderType;}({});