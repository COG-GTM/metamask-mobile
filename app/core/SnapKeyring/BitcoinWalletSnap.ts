///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import { SnapId } from '@metamask/snaps-sdk';

/**
 * Legacy Bitcoin wallet snap ID, retained for backward compatibility
 * during migration to the native BitcoinController.
 *
 * @deprecated Use BitcoinController instead of the snap-based integration.
 */
export const BITCOIN_WALLET_SNAP_ID: SnapId =
  'npm:@metamask/bitcoin-wallet-snap' as SnapId;

export const BITCOIN_WALLET_NAME = 'Bitcoin Wallet';
///: END:ONLY_INCLUDE_IF
