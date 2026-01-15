export interface BrowserState {
  history: Array<{ url: string; name: string }>;
  whitelist: string[];
  tabs: Array<{
    url: string;
    linkType?: string;
    id: string;
  }>;
  favicons: Array<{ origin: string; url: string }>;
  activeTab: string | null;
  visitedDappsByHostname: Record<string, boolean>;
}
