import { type BrowserHistoryEntry, type BrowserTabState, type FaviconEntry } from '../../actions/browser/types';

export { type BrowserTabState } from '../../actions/browser/types';

/**
 * Visited dapps by hostname record
 */
export type VisitedDappsByHostname = Record<string, boolean>;

/**
 * Browser state interface
 */
export interface BrowserState {
  history: BrowserHistoryEntry[];
  whitelist: string[];
  tabs: BrowserTabState[];
  favicons: FaviconEntry[];
  activeTab: number | null;
  visitedDappsByHostname: VisitedDappsByHostname;
}
