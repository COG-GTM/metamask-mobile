export interface WalletConnectClientOptions {
  clientMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl: boolean;
  };
}

export const CLIENT_OPTIONS: WalletConnectClientOptions = {
  clientMeta: {
    // Required
    description: 'MetaMask Mobile app',
    url: 'https://metamask.io',
    icons: [],
    name: 'MetaMask',
    ssl: true,
  },
};

export const WALLET_CONNECT_ORIGIN = 'wc::';
