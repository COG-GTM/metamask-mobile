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
}

/**
 * Favicon entry
 */
export interface FaviconEntry {
  origin: string;
  url: string;
}

/**
 * Visited dapps by hostname
 */
export type VisitedDappsByHostname = Record<string, boolean>;

/**
 * Browser reducer state
 */
export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTab[];
  favicons: FaviconEntry[];
  activeTab: number | null;
  visitedDappsByHostname: VisitedDappsByHostname;
}
