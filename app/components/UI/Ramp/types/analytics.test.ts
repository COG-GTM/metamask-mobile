import type { AnalyticsEvents, ScreenLocation } from './analytics';

describe('analytics types', () => {
  it('accepts all documented ScreenLocation values', () => {
    const locations: ScreenLocation[] = [
      'Amount to Buy Screen',
      'Amount to Sell Screen',
      'Payment Method Screen',
      'Region Screen',
      'Quotes Screen',
      'Provider Webview',
      'Provider InApp Browser',
      'Get Started Screen',
      'Network Switcher Screen',
      'Order Details Screen',
      'Settings Screen',
    ];
    expect(locations).toHaveLength(11);
    expect(new Set(locations).size).toBe(locations.length);
  });

  it('lets callers build analytics payloads that match the AnalyticsEvents map', () => {
    const buyButtonClicked: AnalyticsEvents['BUY_BUTTON_CLICKED'] = {
      text: 'Buy',
      location: 'Amount to Buy Screen',
      chain_id_destination: '1',
    };
    const sellButtonClicked: AnalyticsEvents['SELL_BUTTON_CLICKED'] = {
      text: 'Sell',
      location: 'Amount to Sell Screen',
      chain_id_source: '1',
    };
    const onrampError: AnalyticsEvents['ONRAMP_ERROR'] = {
      location: 'Quotes Screen',
      message: 'boom',
    };
    expect(buyButtonClicked.text).toBe('Buy');
    expect(sellButtonClicked.text).toBe('Sell');
    expect(onrampError.location).toBe('Quotes Screen');
  });
});
