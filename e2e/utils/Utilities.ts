import { blacklistURLs } from '../resources/blacklistURLs.json';

export default class Utilities {
  /**
   * Formats an array of strings into a regex pattern string for exact matching.
   */
  static formatForExactMatchGroup(regexstrings: string[]): string {
    return `\\("${regexstrings.join('","')}"\\)`;
  }

  /**
   * Returns a regex pattern string formatted for exact matching of blacklisted URLs.
   */
  static get BlacklistURLs(): string {
    return this.formatForExactMatchGroup(blacklistURLs);
  }
}
