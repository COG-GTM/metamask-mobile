export interface WalletConnectClientMeta {
  description: string;
  url: string;
  icons: string[];
  name: string;
  ssl: boolean;
}

export interface WalletConnectClientOptions {
  clientMeta: WalletConnectClientMeta;
}

export const CLIENT_OPTIONS: WalletConnectClientOptions = {
  clientMeta: {
    description: 'MetaMask Mobile app',
    url: 'https://metamask.io',
    icons: [],
    name: 'MetaMask',
    ssl: true,
  },
};

export const WALLET_CONNECT_ORIGIN = 'wc::';
