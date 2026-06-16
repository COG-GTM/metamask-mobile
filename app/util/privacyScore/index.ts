/**
 * Privacy Score Calculator
 *
 * Pure utility that converts a snapshot of a user's privacy-relevant wallet
 * settings into a numeric privacy score (0–100), a tier label, a per-category
 * breakdown, and a list of actionable recommendations.
 *
 * The module is intentionally framework-agnostic: it does not import from the
 * Redux store or any controller. Callers should map their own state into the
 * `PrivacySettingsInput` shape before invoking `computePrivacyScore`. This
 * keeps the scoring logic easy to test and reuse (UI panels, telemetry-free
 * self-checks, marketing nudges, etc.).
 */

export type PrivacyCategory =
  | 'telemetry'
  | 'network'
  | 'browser'
  | 'identity'
  | 'display'
  | 'connections';

export type PrivacyTier = 'minimal' | 'basic' | 'enhanced' | 'maximum';

export type RecommendationSeverity = 'info' | 'low' | 'medium' | 'high';

/**
 * A snapshot of the user-controlled settings that influence privacy. Every
 * field is optional so callers can pass partial state; missing fields are
 * treated as "unknown" and excluded from both the earned and max totals so
 * they neither help nor hurt the score.
 */
export interface PrivacySettingsInput {
  // Telemetry & analytics
  isMetaMetricsEnabled?: boolean;
  isDataCollectionForMarketingEnabled?: boolean;
  isSentryEnabled?: boolean;

  // Network privacy (third-party API calls that can leak the user's address)
  isBasicFunctionalityEnabled?: boolean;
  isIncomingTransactionsEnabled?: boolean;
  isTokenAutodetectEnabled?: boolean;
  isNftAutodetectEnabled?: boolean;
  isCurrencyRateCheckEnabled?: boolean;
  isUseTransactionSimulationsEnabled?: boolean;
  isMultiAccountBalancesEnabled?: boolean;
  isUseSafeChainsListValidationEnabled?: boolean;

  // Browser & dApp privacy
  isPhishingDetectionEnabled?: boolean;
  isIpfsGatewayCustom?: boolean;
  searchEngine?: string;

  // Identity / sync
  isProfileSyncEnabled?: boolean;
  isBackupAndSyncEnabled?: boolean;

  // Display
  isPrivacyModeEnabled?: boolean;
  isAutoLockEnabled?: boolean;
  /**
   * Auto-lock timeout in seconds. Shorter is more private/secure. Treated as
   * "best" at <= 60s, "good" at <= 300s, "ok" at <= 1800s, "poor" otherwise.
   */
  autoLockTimeoutSeconds?: number;

  // Connections / dApp permissions
  /** Number of dApps that currently have an active permission. */
  numConnectedDappPermissions?: number;
  /** Number of hardware-backed accounts. Slightly boosts the score. */
  numHardwareWallets?: number;
}

export interface PrivacyScoreCategoryBreakdown {
  category: PrivacyCategory;
  earned: number;
  max: number;
}

export interface PrivacyRecommendation {
  id: string;
  category: PrivacyCategory;
  severity: RecommendationSeverity;
  title: string;
  description: string;
}

export interface PrivacyScoreResult {
  /** Score from 0 to 100 (rounded to nearest integer). */
  score: number;
  /** Tier label derived from the score. */
  tier: PrivacyTier;
  /** Per-category point breakdown. */
  breakdown: PrivacyScoreCategoryBreakdown[];
  /**
   * Actionable recommendations sorted by severity (high first). Each
   * recommendation corresponds to a setting the user could change to improve
   * their score.
   */
  recommendations: PrivacyRecommendation[];
}

/** Thresholds used by `tierForScore`. Exposed for tests and UI consumers. */
export const PRIVACY_TIER_THRESHOLDS: Readonly<Record<PrivacyTier, number>> = {
  minimal: 0,
  basic: 40,
  enhanced: 70,
  maximum: 90,
};

const SEVERITY_ORDER: Record<RecommendationSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
  info: 3,
};

const SEARCH_ENGINE_SCORES: Record<string, number> = {
  duckduckgo: 1,
  brave: 1,
  startpage: 1,
  ecosia: 0.75,
  qwant: 1,
  bing: 0.25,
  yahoo: 0.25,
  google: 0,
};

/** Maximum points each category can contribute. Sums to 100. */
export const PRIVACY_CATEGORY_MAX_POINTS: Readonly<
  Record<PrivacyCategory, number>
> = {
  telemetry: 20,
  network: 30,
  browser: 15,
  identity: 10,
  display: 15,
  connections: 10,
};

interface InternalRule {
  id: string;
  category: PrivacyCategory;
  weight: number;
  /**
   * Returns a value in [0, 1] indicating how privacy-friendly the current
   * setting is, or `null` if the field was not provided (in which case the
   * rule is excluded from the totals).
   */
  evaluate: (input: PrivacySettingsInput) => number | null;
  recommendation?: Omit<PrivacyRecommendation, 'severity'> & {
    severityWhenZero: RecommendationSeverity;
  };
}

const boolToScore = (
  value: boolean | undefined,
  privacyFriendlyValue: boolean,
): number | null => {
  if (value === undefined) {
    return null;
  }
  return value === privacyFriendlyValue ? 1 : 0;
};

const RULES: InternalRule[] = [
  // ---------- telemetry ----------
  {
    id: 'metametrics',
    category: 'telemetry',
    weight: 10,
    evaluate: (s) => boolToScore(s.isMetaMetricsEnabled, false),
    recommendation: {
      id: 'metametrics',
      category: 'telemetry',
      title: 'Disable MetaMetrics',
      description:
        'Turn off MetaMetrics to stop sharing anonymized usage data with MetaMask.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'marketing-data',
    category: 'telemetry',
    weight: 6,
    evaluate: (s) => boolToScore(s.isDataCollectionForMarketingEnabled, false),
    recommendation: {
      id: 'marketing-data',
      category: 'telemetry',
      title: 'Disable marketing data collection',
      description:
        'Opt out of data collection used for product marketing and outreach.',
      severityWhenZero: 'low',
    },
  },
  {
    id: 'sentry',
    category: 'telemetry',
    weight: 4,
    evaluate: (s) => boolToScore(s.isSentryEnabled, false),
    recommendation: {
      id: 'sentry',
      category: 'telemetry',
      title: 'Disable crash reports',
      description:
        'Turn off Sentry crash reporting to avoid sending diagnostic data when errors occur.',
      severityWhenZero: 'low',
    },
  },

  // ---------- network ----------
  {
    id: 'basic-functionality',
    category: 'network',
    weight: 6,
    evaluate: (s) => boolToScore(s.isBasicFunctionalityEnabled, false),
    recommendation: {
      id: 'basic-functionality',
      category: 'network',
      title: 'Disable basic functionality',
      description:
        'Turning off "Basic functionality" stops the wallet from making background calls to MetaMask services. This significantly improves privacy at the cost of features such as token detection and price feeds.',
      severityWhenZero: 'info',
    },
  },
  {
    id: 'incoming-transactions',
    category: 'network',
    weight: 5,
    evaluate: (s) => boolToScore(s.isIncomingTransactionsEnabled, false),
    recommendation: {
      id: 'incoming-transactions',
      category: 'network',
      title: 'Disable incoming transaction lookup',
      description:
        'Disabling incoming transactions prevents Etherscan from learning your address whenever the wallet polls for activity.',
      severityWhenZero: 'high',
    },
  },
  {
    id: 'token-autodetect',
    category: 'network',
    weight: 4,
    evaluate: (s) => boolToScore(s.isTokenAutodetectEnabled, false),
    recommendation: {
      id: 'token-autodetect',
      category: 'network',
      title: 'Disable token autodetection',
      description:
        'Token autodetection sends your address to a third-party service to enumerate balances. Disable it for stronger privacy.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'nft-autodetect',
    category: 'network',
    weight: 3,
    evaluate: (s) => boolToScore(s.isNftAutodetectEnabled, false),
    recommendation: {
      id: 'nft-autodetect',
      category: 'network',
      title: 'Disable NFT autodetection',
      description:
        'NFT autodetection reveals your address to NFT indexing services. Disable to improve privacy.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'currency-rate-check',
    category: 'network',
    weight: 3,
    evaluate: (s) => boolToScore(s.isCurrencyRateCheckEnabled, false),
    recommendation: {
      id: 'currency-rate-check',
      category: 'network',
      title: 'Disable price feed lookups',
      description:
        'The currency rate check pings a price API on a recurring basis. Disable for maximum privacy.',
      severityWhenZero: 'low',
    },
  },
  {
    id: 'transaction-simulations',
    category: 'network',
    weight: 4,
    evaluate: (s) => boolToScore(s.isUseTransactionSimulationsEnabled, false),
    recommendation: {
      id: 'transaction-simulations',
      category: 'network',
      title: 'Disable transaction simulations',
      description:
        'Transaction simulations forward your unsigned transactions to a remote service. Disabling improves privacy at the cost of pre-flight insights.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'multi-account-balances',
    category: 'network',
    weight: 3,
    evaluate: (s) => boolToScore(s.isMultiAccountBalancesEnabled, false),
    recommendation: {
      id: 'multi-account-balances',
      category: 'network',
      title: 'Disable batched balance requests',
      description:
        'Batching balance requests for all accounts links them together in a single RPC call. Disable to keep accounts more isolated from RPC providers.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'safe-chains-validation',
    category: 'network',
    weight: 2,
    evaluate: (s) => boolToScore(s.isUseSafeChainsListValidationEnabled, false),
    recommendation: {
      id: 'safe-chains-validation',
      category: 'network',
      title: 'Disable safe-chain list validation',
      description:
        'This setting calls chainid.network when adding networks. Disabling it prevents that call.',
      severityWhenZero: 'info',
    },
  },

  // ---------- browser ----------
  {
    id: 'phishing-detection',
    category: 'browser',
    weight: 6,
    evaluate: (s) => boolToScore(s.isPhishingDetectionEnabled, true),
    recommendation: {
      id: 'phishing-detection',
      category: 'browser',
      title: 'Enable phishing detection',
      description:
        'Phishing detection protects you from malicious sites. The privacy cost is minimal because lookups are performed against a locally cached list.',
      severityWhenZero: 'high',
    },
  },
  {
    id: 'ipfs-gateway',
    category: 'browser',
    weight: 4,
    evaluate: (s) => boolToScore(s.isIpfsGatewayCustom, true),
    recommendation: {
      id: 'ipfs-gateway',
      category: 'browser',
      title: 'Use a custom IPFS gateway',
      description:
        'The default IPFS gateway logs every request you make. Configure a self-hosted or trusted gateway for better privacy.',
      severityWhenZero: 'low',
    },
  },
  {
    id: 'search-engine',
    category: 'browser',
    weight: 5,
    evaluate: (s) => {
      if (s.searchEngine === undefined) {
        return null;
      }
      const key = s.searchEngine.trim().toLowerCase();
      if (Object.prototype.hasOwnProperty.call(SEARCH_ENGINE_SCORES, key)) {
        return SEARCH_ENGINE_SCORES[key];
      }
      return 0.5;
    },
    recommendation: {
      id: 'search-engine',
      category: 'browser',
      title: 'Switch to a privacy-respecting search engine',
      description:
        'Choose DuckDuckGo, Brave Search or Startpage to avoid sharing search queries with trackers.',
      severityWhenZero: 'medium',
    },
  },

  // ---------- identity ----------
  {
    id: 'profile-sync',
    category: 'identity',
    weight: 5,
    evaluate: (s) => boolToScore(s.isProfileSyncEnabled, false),
    recommendation: {
      id: 'profile-sync',
      category: 'identity',
      title: 'Disable profile sync',
      description:
        'Profile sync uploads identity metadata to MetaMask servers. Disable for stronger privacy.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'backup-and-sync',
    category: 'identity',
    weight: 5,
    evaluate: (s) => boolToScore(s.isBackupAndSyncEnabled, false),
    recommendation: {
      id: 'backup-and-sync',
      category: 'identity',
      title: 'Disable backup & sync',
      description:
        'Backup & sync stores wallet metadata in the cloud. Disable to keep that information local.',
      severityWhenZero: 'low',
    },
  },

  // ---------- display ----------
  {
    id: 'privacy-mode',
    category: 'display',
    weight: 6,
    evaluate: (s) => boolToScore(s.isPrivacyModeEnabled, true),
    recommendation: {
      id: 'privacy-mode',
      category: 'display',
      title: 'Enable privacy mode',
      description:
        'Privacy mode hides balances by default so they are not visible to onlookers.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'auto-lock-enabled',
    category: 'display',
    weight: 4,
    evaluate: (s) => boolToScore(s.isAutoLockEnabled, true),
    recommendation: {
      id: 'auto-lock-enabled',
      category: 'display',
      title: 'Enable auto-lock',
      description:
        'Auto-lock prevents the wallet from staying unlocked when you put your phone down.',
      severityWhenZero: 'high',
    },
  },
  {
    id: 'auto-lock-timeout',
    category: 'display',
    weight: 5,
    evaluate: (s) => {
      if (s.autoLockTimeoutSeconds === undefined) {
        return null;
      }
      const seconds = s.autoLockTimeoutSeconds;
      if (seconds <= 0) {
        return 0;
      }
      if (seconds <= 60) {
        return 1;
      }
      if (seconds <= 300) {
        return 0.75;
      }
      if (seconds <= 1800) {
        return 0.4;
      }
      return 0.1;
    },
    recommendation: {
      id: 'auto-lock-timeout',
      category: 'display',
      title: 'Reduce auto-lock timeout',
      description:
        'Set the auto-lock timeout to 5 minutes or less. Shorter timeouts reduce the window in which a stolen device can access your wallet.',
      severityWhenZero: 'medium',
    },
  },

  // ---------- connections ----------
  {
    id: 'connected-dapps',
    category: 'connections',
    weight: 7,
    evaluate: (s) => {
      if (s.numConnectedDappPermissions === undefined) {
        return null;
      }
      const n = Math.max(0, Math.floor(s.numConnectedDappPermissions));
      if (n === 0) {
        return 1;
      }
      if (n <= 3) {
        return 0.85;
      }
      if (n <= 10) {
        return 0.6;
      }
      if (n <= 25) {
        return 0.3;
      }
      return 0;
    },
    recommendation: {
      id: 'connected-dapps',
      category: 'connections',
      title: 'Revoke unused dApp connections',
      description:
        'Connected dApps can see the addresses you exposed to them. Periodically review and revoke connections you no longer use.',
      severityWhenZero: 'medium',
    },
  },
  {
    id: 'hardware-wallets',
    category: 'connections',
    weight: 3,
    evaluate: (s) => {
      if (s.numHardwareWallets === undefined) {
        return null;
      }
      const n = Math.max(0, Math.floor(s.numHardwareWallets));
      if (n === 0) {
        return 0;
      }
      if (n === 1) {
        return 0.75;
      }
      return 1;
    },
    recommendation: {
      id: 'hardware-wallets',
      category: 'connections',
      title: 'Use a hardware wallet',
      description:
        'Hardware wallets keep your private keys offline. Pair at least one for higher-value accounts.',
      severityWhenZero: 'info',
    },
  },
];

/**
 * Map a numeric score to a privacy tier label.
 *
 * @param score - The privacy score (0–100).
 * @returns The tier label.
 */
export function tierForScore(score: number): PrivacyTier {
  if (score >= PRIVACY_TIER_THRESHOLDS.maximum) {
    return 'maximum';
  }
  if (score >= PRIVACY_TIER_THRESHOLDS.enhanced) {
    return 'enhanced';
  }
  if (score >= PRIVACY_TIER_THRESHOLDS.basic) {
    return 'basic';
  }
  return 'minimal';
}

const clamp01 = (value: number): number => {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
};

/**
 * Compute a privacy score from a snapshot of user settings.
 *
 * Unknown (undefined) fields are excluded from both numerator and denominator
 * so partial inputs do not artificially deflate the score. If absolutely no
 * fields are provided, the score defaults to 0 with the `minimal` tier and an
 * informational recommendation.
 *
 * @param settings - The snapshot of privacy-relevant settings.
 * @returns The computed score, tier, breakdown, and recommendations.
 */
export function computePrivacyScore(
  settings: PrivacySettingsInput,
): PrivacyScoreResult {
  const breakdownByCategory: Record<
    PrivacyCategory,
    { earned: number; max: number }
  > = {
    telemetry: { earned: 0, max: 0 },
    network: { earned: 0, max: 0 },
    browser: { earned: 0, max: 0 },
    identity: { earned: 0, max: 0 },
    display: { earned: 0, max: 0 },
    connections: { earned: 0, max: 0 },
  };

  const recommendations: PrivacyRecommendation[] = [];
  let totalEarned = 0;
  let totalMax = 0;

  for (const rule of RULES) {
    const raw = rule.evaluate(settings);
    if (raw === null) {
      continue;
    }

    const normalized = clamp01(raw);
    const earnedPoints = normalized * rule.weight;

    breakdownByCategory[rule.category].earned += earnedPoints;
    breakdownByCategory[rule.category].max += rule.weight;
    totalEarned += earnedPoints;
    totalMax += rule.weight;

    if (rule.recommendation && normalized < 1) {
      const baseSeverity = rule.recommendation.severityWhenZero;
      const severity: RecommendationSeverity =
        normalized <= 0
          ? baseSeverity
          : downgradeSeverity(baseSeverity, normalized);
      recommendations.push({
        id: rule.recommendation.id,
        category: rule.recommendation.category,
        title: rule.recommendation.title,
        description: rule.recommendation.description,
        severity,
      });
    }
  }

  // Normalize to a 0–100 score using the *theoretical* max for the categories
  // that were actually evaluated. This keeps partial inputs honest: a user who
  // only supplied telemetry settings still gets a meaningful score relative to
  // those categories.
  const score =
    totalMax === 0 ? 0 : Math.round((totalEarned / totalMax) * 100);

  const breakdown: PrivacyScoreCategoryBreakdown[] = (
    Object.keys(breakdownByCategory) as PrivacyCategory[]
  )
    .map((category) => {
      const entry = breakdownByCategory[category];
      return {
        category,
        earned: roundToTenth(entry.earned),
        max: entry.max,
      };
    })
    .filter((entry) => entry.max > 0);

  recommendations.sort((a, b) => {
    const severityDelta =
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return a.id.localeCompare(b.id);
  });

  return {
    score,
    tier: tierForScore(score),
    breakdown,
    recommendations,
  };
}

const roundToTenth = (value: number): number => Math.round(value * 10) / 10;

const downgradeSeverity = (
  base: RecommendationSeverity,
  normalized: number,
): RecommendationSeverity => {
  // The closer the user is to the privacy-friendly value, the lower the
  // severity. We only downgrade when partial credit was earned (0 < n < 1).
  if (normalized >= 0.75) {
    return 'info';
  }
  if (normalized >= 0.5) {
    return base === 'high' ? 'low' : 'info';
  }
  if (normalized >= 0.25) {
    return base === 'high' ? 'medium' : 'low';
  }
  return base;
};
