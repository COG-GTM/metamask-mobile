///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)


import { HandlerType } from '@metamask/snaps-utils';

// This dependency is still installed as part of the `package.json`, however
// the Snap is being pre-installed only for Flask build (for the moment).
import SolanaWalletSnap from '@metamask/solana-wallet-snap/dist/preinstalled-snap.json';
import { handleSnapRequest } from '../Snaps/utils';
import Engine from '../Engine';

export const SOLANA_WALLET_SNAP_ID = SolanaWalletSnap.snapId;

export const SOLANA_WALLET_NAME =
SolanaWalletSnap.manifest.proposedName;

const controllerMessenger = Engine.controllerMessenger;

export class SolanaWalletSnapSender {
  // We assume the caller of this module is aware of this. If we try to use this module
  // without having the pre-installed Snap, this will likely throw an error in
  // the `handleSnapRequest` action.
  send = async (request) =>
  await handleSnapRequest(controllerMessenger, {
    origin: 'metamask',
    snapId: SOLANA_WALLET_SNAP_ID,
    handler: HandlerType.OnKeyringRequest,
    request
  });
}
///: END:ONLY_INCLUDE_IF