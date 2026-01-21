export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: string;
  linkType?: string;
}

export interface BrowserFavicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: BrowserFavicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}
