import { ImageSourcePropType } from 'react-native';
import MATIC from './matic.png';
import POL from './pol.png';
import PALM from './palm.png';
import AETH from './arbitrum.png';
import OPTIMISM from './optimism.png';
import ONE from './harmony.png';
import FTM from './fantom.png';
import ETHEREUM from './eth-logo-new.png';
import BNB from './binance.png';
import AVAX from './avalanche.png';
import LINEA_TESTNET from './linea-testnet-logo.png';
import SEPOLIA from './sepolia-logo-dark.png';
import LINEA_MAINNET from './linea-mainnet-logo.png';
import APE_TOKEN from './ape-token.png';
import SOLANA from './solana-logo.png';
import GRAVITY from './gravity.png';
import KAIA_MAINNET from './kaia.png';
import FOX_LOGO from '../../app/images/branding/tiny-logo.png';
import BTC from './bitcoin-logo.png';
import BASE from './base.png';
import MEGAETH_TESTNET from './megaeth-testnet-logo.png';
import XRPLEVM_XRP_TOKEN from './xrp-logo.png';
import MATCHAIN from './matchain.png';
import FLOW from './flow.png';
import LENS from './lens.png';
import PLUME from './plume.png';

interface ImageIcons {
  [key: string]: ImageSourcePropType;
  PALM: ImageSourcePropType;
  MATIC: ImageSourcePropType;
  POL: ImageSourcePropType;
  OPTIMISM: ImageSourcePropType;
  ONE: ImageSourcePropType;
  FTM: ImageSourcePropType;
  ETHEREUM: ImageSourcePropType;
  BNB: ImageSourcePropType;
  AETH: ImageSourcePropType;
  AVAX: ImageSourcePropType;
  'LINEA-GOERLI': ImageSourcePropType;
  'LINEA-SEPOLIA': ImageSourcePropType;
  SEPOLIA: ImageSourcePropType;
  'LINEA-MAINNET': ImageSourcePropType;
  APE: ImageSourcePropType;
  G: ImageSourcePropType;
  'KAIA-MAINNET': ImageSourcePropType;
  'KAIA-KAIROS-TESTNET': ImageSourcePropType;
  SOLANA: ImageSourcePropType;
  FOX_LOGO: ImageSourcePropType;
  BTC: ImageSourcePropType;
  BASE: ImageSourcePropType;
  'MEGAETH-TESTNET': ImageSourcePropType;
  XRPLEVM_XRP_TOKEN: ImageSourcePropType;
  MATCHAIN: ImageSourcePropType;
  FLOW: ImageSourcePropType;
  LENS: ImageSourcePropType;
  PLUME: ImageSourcePropType;
}

const imageIcons: ImageIcons = {
  PALM,
  MATIC,
  POL,
  OPTIMISM,
  ONE,
  FTM,
  ETHEREUM,
  BNB,
  AETH,
  AVAX,
  'LINEA-GOERLI': LINEA_TESTNET,
  'LINEA-SEPOLIA': LINEA_TESTNET,
  SEPOLIA,
  'LINEA-MAINNET': LINEA_MAINNET,
  APE: APE_TOKEN,
  G: GRAVITY,
  'KAIA-MAINNET': KAIA_MAINNET,
  'KAIA-KAIROS-TESTNET': KAIA_MAINNET,
  SOLANA,
  FOX_LOGO,
  BTC,
  BASE,
  'MEGAETH-TESTNET': MEGAETH_TESTNET,
  XRPLEVM_XRP_TOKEN,
  MATCHAIN,
  FLOW,
  LENS,
  PLUME,
};

export default imageIcons;
