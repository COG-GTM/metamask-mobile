const toActionId = (name) => `${name}-action`;

export const AccountActionsBottomSheetSelectorsIDs = {
  EDIT_ACCOUNT: toActionId('edit-account'),
  VIEW_ETHERSCAN: toActionId('view-etherscan'),
  SHARE_ADDRESS: toActionId('share-address'),
  SHOW_PRIVATE_KEY: toActionId('show-private-key'),
  REMOVE_HARDWARE_ACCOUNT: toActionId('remove-hardware-account'),
  REMOVE_SNAP_ACCOUNT: toActionId('remove-snap-account'),
  SHOW_SECRET_RECOVERY_PHRASE: toActionId('show-secret-recovery-phrase'),
};
