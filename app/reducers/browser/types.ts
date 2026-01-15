/**
 * Browser history entry
 */
export interface BrowserHistoryEntry {
  url: string;
  name: string;
}

/**
 * Browser tab
 */
export interface BrowserTab {
  url: string;
  id: number;
  linkType?: string;
  image?: string;
  isArchived?: boolean;
}

/**
 * Favicon entry
 */
export interface FaviconEntry {
  origin: string;
  url: string;
}

/**
 * Browser state
 */
export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: FaviconEntry[];
  activeTab: number | null;
  visitedDappsByHostname: Record<string, boolean>;
}
