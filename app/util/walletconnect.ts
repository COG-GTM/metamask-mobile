export const CLIENT_OPTIONS: {
  clientMeta: {
    description: string;
    url: string;
    icons: string[];
    name: string;
    ssl: boolean;
  };
} = {
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
