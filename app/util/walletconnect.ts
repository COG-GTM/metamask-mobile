export interface ClientMeta {
  description: string;
  url: string;
  icons: string[];
  name: string;
  ssl: boolean;
}

export interface ClientOptions {
  clientMeta: ClientMeta;
}

export const CLIENT_OPTIONS: ClientOptions = {
  clientMeta: {
    description: 'MetaMask Mobile app',
    url: 'https://metamask.io',
    icons: [],
    name: 'MetaMask',
    ssl: true,
  },
};

export const WALLET_CONNECT_ORIGIN = 'wc::';
