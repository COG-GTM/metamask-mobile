export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
}

export interface Favicon {
  origin: string;
  url: string;
}

export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: Favicon[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}
