import {
  computePrivacyScore,
  PRIVACY_CATEGORY_MAX_POINTS,
  PRIVACY_TIER_THRESHOLDS,
  PrivacySettingsInput,
  tierForScore,
} from '.';

const PRIVACY_FRIENDLY_SETTINGS: Required<PrivacySettingsInput> = {
  // telemetry
  isMetaMetricsEnabled: false,
  isDataCollectionForMarketingEnabled: false,
  isSentryEnabled: false,
  // network
  isBasicFunctionalityEnabled: false,
  isIncomingTransactionsEnabled: false,
  isTokenAutodetectEnabled: false,
  isNftAutodetectEnabled: false,
  isCurrencyRateCheckEnabled: false,
  isUseTransactionSimulationsEnabled: false,
  isMultiAccountBalancesEnabled: false,
  isUseSafeChainsListValidationEnabled: false,
  // browser
  isPhishingDetectionEnabled: true,
  isIpfsGatewayCustom: true,
  searchEngine: 'DuckDuckGo',
  // identity
  isProfileSyncEnabled: false,
  isBackupAndSyncEnabled: false,
  // display
  isPrivacyModeEnabled: true,
  isAutoLockEnabled: true,
  autoLockTimeoutSeconds: 30,
  // connections
  numConnectedDappPermissions: 0,
  numHardwareWallets: 2,
};

const PRIVACY_HOSTILE_SETTINGS: Required<PrivacySettingsInput> = {
  // telemetry
  isMetaMetricsEnabled: true,
  isDataCollectionForMarketingEnabled: true,
  isSentryEnabled: true,
  // network
  isBasicFunctionalityEnabled: true,
  isIncomingTransactionsEnabled: true,
  isTokenAutodetectEnabled: true,
  isNftAutodetectEnabled: true,
  isCurrencyRateCheckEnabled: true,
  isUseTransactionSimulationsEnabled: true,
  isMultiAccountBalancesEnabled: true,
  isUseSafeChainsListValidationEnabled: true,
  // browser
  isPhishingDetectionEnabled: false,
  isIpfsGatewayCustom: false,
  searchEngine: 'Google',
  // identity
  isProfileSyncEnabled: true,
  isBackupAndSyncEnabled: true,
  // display
  isPrivacyModeEnabled: false,
  isAutoLockEnabled: false,
  autoLockTimeoutSeconds: 86400,
  // connections
  numConnectedDappPermissions: 50,
  numHardwareWallets: 0,
};

describe('tierForScore', () => {
  it('maps the score 0 to "minimal"', () => {
    expect(tierForScore(0)).toBe('minimal');
  });

  it('maps a sub-basic score to "minimal"', () => {
    expect(tierForScore(PRIVACY_TIER_THRESHOLDS.basic - 1)).toBe('minimal');
  });

  it('maps the basic threshold to "basic"', () => {
    expect(tierForScore(PRIVACY_TIER_THRESHOLDS.basic)).toBe('basic');
  });

  it('maps the enhanced threshold to "enhanced"', () => {
    expect(tierForScore(PRIVACY_TIER_THRESHOLDS.enhanced)).toBe('enhanced');
  });

  it('maps the maximum threshold to "maximum"', () => {
    expect(tierForScore(PRIVACY_TIER_THRESHOLDS.maximum)).toBe('maximum');
  });

  it('maps 100 to "maximum"', () => {
    expect(tierForScore(100)).toBe('maximum');
  });
});

describe('PRIVACY_CATEGORY_MAX_POINTS', () => {
  it('sums to 100', () => {
    const total = Object.values(PRIVACY_CATEGORY_MAX_POINTS).reduce(
      (sum, n) => sum + n,
      0,
    );
    expect(total).toBe(100);
  });
});

describe('computePrivacyScore', () => {
  it('returns score 0 with the minimal tier when no input is supplied', () => {
    const result = computePrivacyScore({});
    expect(result.score).toBe(0);
    expect(result.tier).toBe('minimal');
    expect(result.breakdown).toEqual([]);
    expect(result.recommendations).toEqual([]);
  });

  it('returns 100 and the maximum tier for the most privacy-friendly settings', () => {
    const result = computePrivacyScore(PRIVACY_FRIENDLY_SETTINGS);
    expect(result.score).toBe(100);
    expect(result.tier).toBe('maximum');
    expect(result.recommendations).toEqual([]);
  });

  it('returns a low score and minimal tier for the most hostile settings', () => {
    const result = computePrivacyScore(PRIVACY_HOSTILE_SETTINGS);
    expect(result.tier).toBe('minimal');
    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.recommendations.length).toBeGreaterThan(10);
  });

  it('exposes a breakdown for every category once all inputs are supplied', () => {
    const result = computePrivacyScore(PRIVACY_FRIENDLY_SETTINGS);
    const categories = result.breakdown.map((b) => b.category).sort();
    expect(categories).toEqual([
      'browser',
      'connections',
      'display',
      'identity',
      'network',
      'telemetry',
    ]);
    for (const entry of result.breakdown) {
      expect(entry.earned).toBeCloseTo(
        PRIVACY_CATEGORY_MAX_POINTS[entry.category],
        5,
      );
      expect(entry.max).toBe(PRIVACY_CATEGORY_MAX_POINTS[entry.category]);
    }
  });

  it('treats undefined fields as unknown (does not affect the score)', () => {
    const result = computePrivacyScore({
      isMetaMetricsEnabled: false,
    });
    expect(result.score).toBe(100);
    expect(result.breakdown).toHaveLength(1);
    expect(result.breakdown[0].category).toBe('telemetry');
    expect(result.breakdown[0].earned).toBeCloseTo(10, 5);
    expect(result.breakdown[0].max).toBe(10);
    expect(result.recommendations).toEqual([]);
  });

  it('flags hostile telemetry settings with telemetry recommendations', () => {
    const result = computePrivacyScore({
      isMetaMetricsEnabled: true,
      isDataCollectionForMarketingEnabled: true,
      isSentryEnabled: true,
    });
    const ids = result.recommendations.map((r) => r.id).sort();
    expect(ids).toEqual(['marketing-data', 'metametrics', 'sentry']);
    expect(result.score).toBe(0);
    expect(result.tier).toBe('minimal');
  });

  it('emits a recommendation when phishing detection is disabled', () => {
    const result = computePrivacyScore({
      isPhishingDetectionEnabled: false,
    });
    expect(result.recommendations).toHaveLength(1);
    expect(result.recommendations[0].id).toBe('phishing-detection');
    expect(result.recommendations[0].severity).toBe('high');
    expect(result.score).toBe(0);
  });

  it('does not emit a recommendation for the privacy-friendly setting', () => {
    const result = computePrivacyScore({
      isPhishingDetectionEnabled: true,
      isMetaMetricsEnabled: false,
    });
    expect(result.recommendations).toEqual([]);
    expect(result.score).toBe(100);
  });

  it('sorts recommendations by severity (high → info)', () => {
    const result = computePrivacyScore(PRIVACY_HOSTILE_SETTINGS);
    const severities = result.recommendations.map((r) => r.severity);
    const order = ['high', 'medium', 'low', 'info'];
    let lastIndex = -1;
    for (const severity of severities) {
      const idx = order.indexOf(severity);
      expect(idx).toBeGreaterThanOrEqual(lastIndex);
      lastIndex = idx;
    }
  });

  it('breaks recommendation ties by id alphabetically within a severity', () => {
    const result = computePrivacyScore({
      isMetaMetricsEnabled: true,
      isTokenAutodetectEnabled: true,
      isNftAutodetectEnabled: true,
    });
    const mediumOnly = result.recommendations
      .filter((r) => r.severity === 'medium')
      .map((r) => r.id);
    expect(mediumOnly).toEqual([...mediumOnly].sort());
  });

  describe('search engine scoring', () => {
    it.each([
      ['DuckDuckGo', 100],
      ['duckduckgo', 100],
      ['Brave', 100],
      ['Startpage', 100],
      ['Qwant', 100],
      ['Google', 0],
      ['Bing', 25],
      ['Yahoo', 25],
      ['Ecosia', 75],
      ['UnknownEngine', 50],
    ])('scores %s as %d', (engine, expected) => {
      const result = computePrivacyScore({ searchEngine: engine });
      expect(result.score).toBe(expected);
    });

    it('emits a search-engine recommendation only when score < 100', () => {
      const friendly = computePrivacyScore({ searchEngine: 'DuckDuckGo' });
      expect(friendly.recommendations).toEqual([]);

      const hostile = computePrivacyScore({ searchEngine: 'Google' });
      expect(hostile.recommendations.map((r) => r.id)).toEqual([
        'search-engine',
      ]);
    });
  });

  describe('auto-lock timeout scoring', () => {
    it.each([
      [-5, 0],
      [0, 0],
      [30, 100],
      [60, 100],
      [120, 75],
      [300, 75],
      [900, 40],
      [1800, 40],
      [3600, 10],
      [86400, 10],
    ])('scores %d seconds at %d', (seconds, expected) => {
      const result = computePrivacyScore({ autoLockTimeoutSeconds: seconds });
      expect(result.score).toBe(expected);
    });
  });

  describe('connected dapps scoring', () => {
    it.each([
      [0, 100],
      [1, 85],
      [3, 85],
      [4, 60],
      [10, 60],
      [11, 30],
      [25, 30],
      [26, 0],
      [1000, 0],
    ])('scores %d connections at %d', (count, expected) => {
      const result = computePrivacyScore({
        numConnectedDappPermissions: count,
      });
      expect(result.score).toBe(expected);
    });

    it('treats negative inputs as zero connections', () => {
      const result = computePrivacyScore({
        numConnectedDappPermissions: -5,
      });
      expect(result.score).toBe(100);
    });

    it('floors fractional inputs', () => {
      const result = computePrivacyScore({
        numConnectedDappPermissions: 0.99,
      });
      expect(result.score).toBe(100);
    });
  });

  describe('hardware wallet scoring', () => {
    it.each([
      [0, 0],
      [1, 75],
      [2, 100],
      [10, 100],
    ])('scores %d hardware wallets at %d', (count, expected) => {
      const result = computePrivacyScore({ numHardwareWallets: count });
      expect(result.score).toBe(expected);
    });

    it('emits an info-severity recommendation when zero hardware wallets are present', () => {
      const result = computePrivacyScore({ numHardwareWallets: 0 });
      expect(result.recommendations).toHaveLength(1);
      expect(result.recommendations[0].severity).toBe('info');
      expect(result.recommendations[0].id).toBe('hardware-wallets');
    });
  });

  describe('partial-credit severity downgrade', () => {
    it('downgrades a high-severity recommendation when partial credit was earned', () => {
      const result = computePrivacyScore({ autoLockTimeoutSeconds: 200 });
      const rec = result.recommendations.find(
        (r) => r.id === 'auto-lock-timeout',
      );
      expect(rec).toBeDefined();
      expect(rec?.severity).toBe('info');
    });

    it('keeps the base severity when no credit was earned', () => {
      const result = computePrivacyScore({
        isPhishingDetectionEnabled: false,
      });
      expect(result.recommendations[0].severity).toBe('high');
    });
  });

  it('rounds the score to the nearest integer', () => {
    const result = computePrivacyScore({
      isMetaMetricsEnabled: true,
      isDataCollectionForMarketingEnabled: false,
      isSentryEnabled: false,
    });
    expect(Number.isInteger(result.score)).toBe(true);
  });

  it('does not include categories with no evaluated rules in the breakdown', () => {
    const result = computePrivacyScore({
      isMetaMetricsEnabled: false,
      isPrivacyModeEnabled: true,
    });
    const categories = result.breakdown.map((b) => b.category).sort();
    expect(categories).toEqual(['display', 'telemetry']);
  });

  it('returns recommendations only for categories with sub-optimal settings', () => {
    const result = computePrivacyScore({
      ...PRIVACY_FRIENDLY_SETTINGS,
      isMetaMetricsEnabled: true,
    });
    expect(result.recommendations.map((r) => r.id)).toEqual(['metametrics']);
    expect(result.score).toBeLessThan(100);
    expect(result.tier).toBe('maximum');
  });

  it('produces a deterministic output for the same input', () => {
    const a = computePrivacyScore(PRIVACY_FRIENDLY_SETTINGS);
    const b = computePrivacyScore(PRIVACY_FRIENDLY_SETTINGS);
    expect(a).toEqual(b);
  });

  it('does not mutate the input object', () => {
    const input: PrivacySettingsInput = { ...PRIVACY_FRIENDLY_SETTINGS };
    const snapshot = JSON.stringify(input);
    computePrivacyScore(input);
    expect(JSON.stringify(input)).toBe(snapshot);
  });

  it('matches the documented category max points when all rules are evaluated', () => {
    const result = computePrivacyScore(PRIVACY_HOSTILE_SETTINGS);
    for (const entry of result.breakdown) {
      expect(entry.max).toBe(PRIVACY_CATEGORY_MAX_POINTS[entry.category]);
    }
  });
});
