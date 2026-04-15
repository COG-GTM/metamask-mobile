
import MessageSigningSnap from '@metamask/message-signing-snap/dist/preinstalled-snap.json';
///: BEGIN:ONLY_INCLUDE_IF(solana)
import SolanaWalletSnap from '@metamask/solana-wallet-snap/dist/preinstalled-snap.json';
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
import BitcoinWalletSnap from '@metamask/bitcoin-wallet-snap/dist/preinstalled-snap.json';
///: END:ONLY_INCLUDE_IF

const PREINSTALLED_SNAPS = Object.freeze([
MessageSigningSnap,
///: BEGIN:ONLY_INCLUDE_IF(solana)
SolanaWalletSnap,
///: END:ONLY_INCLUDE_IF
///: BEGIN:ONLY_INCLUDE_IF(bitcoin)
BitcoinWalletSnap
///: END:ONLY_INCLUDE_IF
]);

export default PREINSTALLED_SNAPS;