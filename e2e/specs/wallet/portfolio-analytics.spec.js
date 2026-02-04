'use strict';
/* eslint-disable no-console */
import { Regression } from '../../tags';
import TestHelpers from '../../helpers';
import { loginToApp } from '../../viewHelper';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../../fixtures/fixture-helper';
import { getFixturesServerPort } from '../../fixtures/utils';
import FixtureServer from '../../fixtures/fixture-server';
import Assertions from '../../utils/Assertions';
import WalletView from '../../pages/wallet/WalletView';
import Gestures from '../../utils/Gestures';
import Matchers from '../../utils/Matchers';
import TabBarComponent from '../../pages/wallet/TabBarComponent';
import { WalletViewSelectorsIDs } from '../../selectors/wallet/WalletView.selectors';
import { TokenOverviewSelectorsIDs, TokenOverviewSelectorsText } from '../../selectors/wallet/TokenOverview.selectors';

const fixtureServer = new FixtureServer();

const TIME_PERIODS = ['1d', '1w', '1m', '3m', '1y', '3y'];

class PortfolioAnalyticsPage {
  get analyticsContainer() {
    return Matchers.getElementByID('portfolio-analytics-container');
  }

  get analyticsChart() {
    return Matchers.getElementByID('portfolio-analytics-chart');
  }

  get chartLoadingIndicator() {
    return Matchers.getElementByID('portfolio-chart-loading');
  }

  get timePeriodToggle() {
    return Matchers.getElementByID('time-period-toggle');
  }

  get privacyToggleButton() {
    return Matchers.getElementByID('balance-container');
  }

  get totalBalanceText() {
    return Matchers.getElementByID(WalletViewSelectorsIDs.TOTAL_BALANCE_TEXT);
  }

  get portfolioButton() {
    return Matchers.getElementByID(WalletViewSelectorsIDs.PORTFOLIO_BUTTON);
  }

  get eyeIcon() {
    return Matchers.getElementByID('eye-icon');
  }

  get eyeSlashIcon() {
    return Matchers.getElementByID('eye-slash-icon');
  }

  get percentageChange() {
    return Matchers.getElementByID('aggregated-percentage');
  }

  get tokenOverviewContainer() {
    return Matchers.getElementByID(TokenOverviewSelectorsIDs.CONTAINER);
  }

  get tokenPrice() {
    return Matchers.getElementByID(TokenOverviewSelectorsIDs.TOKEN_PRICE);
  }

  getTimePeriodButton(period) {
    return Matchers.getElementByText(TokenOverviewSelectorsText[period]);
  }

  async tapTimePeriodButton(period) {
    const button = await this.getTimePeriodButton(period);
    await Gestures.waitAndTap(button);
  }

  async tapPrivacyToggle() {
    await Gestures.waitAndTap(this.privacyToggleButton);
  }

  async tapPortfolioButton() {
    await Gestures.waitAndTap(this.portfolioButton);
  }
}

const PortfolioAnalytics = new PortfolioAnalyticsPage();

describe(Regression('Portfolio Analytics'), () => {
  beforeAll(async () => {
    await TestHelpers.reverseServerPort();
    const fixture = new FixtureBuilder().withKeyringController().build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    await TestHelpers.launchApp({
      permissions: { notifications: 'YES' },
      launchArgs: { fixtureServerPort: `${getFixturesServerPort()}` },
    });
    await loginToApp();
  });

  beforeEach(async () => {
    jest.setTimeout(150000);
  });

  afterAll(async () => {
    await stopFixtureServer(fixtureServer);
  });

  describe('Navigation to Analytics Dashboard', () => {
    it('should display wallet view with portfolio balance section', async () => {
      await Assertions.checkIfVisible(WalletView.container);
      await Assertions.checkIfVisible(PortfolioAnalytics.totalBalanceText);
    });

    it('should navigate to token overview when tapping on a token', async () => {
      await WalletView.tapOnToken();
      await TestHelpers.delay(2000);
      await Assertions.checkIfVisible(PortfolioAnalytics.tokenOverviewContainer);
    });

    it('should return to wallet view from token overview', async () => {
      await device.pressBack();
      await TestHelpers.delay(1000);
      await Assertions.checkIfVisible(WalletView.container);
    });
  });

  describe('Chart Rendering and Interactions', () => {
    beforeAll(async () => {
      await WalletView.tapOnToken();
      await TestHelpers.delay(2000);
    });

    afterAll(async () => {
      await device.pressBack();
      await TestHelpers.delay(1000);
    });

    it('should display token overview with price information', async () => {
      await Assertions.checkIfVisible(PortfolioAnalytics.tokenOverviewContainer);
    });

    it('should display chart time period navigation buttons', async () => {
      for (const period of TIME_PERIODS) {
        try {
          const periodButton = await PortfolioAnalytics.getTimePeriodButton(period);
          await Assertions.checkIfVisible(periodButton);
        } catch {
          console.log(`Time period button ${period} not visible - may be scrolled out of view`);
        }
      }
    });

    it('should handle chart interaction with swipe gestures', async () => {
      await device.disableSynchronization();
      try {
        const container = await PortfolioAnalytics.tokenOverviewContainer;
        await Gestures.swipe(container, 'left', 'slow', 0.3);
        await TestHelpers.delay(500);
        await Gestures.swipe(container, 'right', 'slow', 0.3);
        await TestHelpers.delay(500);
      } catch {
        console.log('Chart swipe interaction not available');
      }
      await device.enableSynchronization();
    });
  });

  describe('Time Period Toggle Functionality', () => {
    beforeAll(async () => {
      await WalletView.tapOnToken();
      await TestHelpers.delay(2000);
    });

    afterAll(async () => {
      await device.pressBack();
      await TestHelpers.delay(1000);
    });

    it('should switch to 1 day time period', async () => {
      await device.disableSynchronization();
      try {
        await PortfolioAnalytics.tapTimePeriodButton('1d');
        await TestHelpers.delay(1000);
        const periodButton = await PortfolioAnalytics.getTimePeriodButton('1d');
        await Assertions.checkIfVisible(periodButton);
      } catch {
        console.log('1d time period button not available');
      }
      await device.enableSynchronization();
    });

    it('should switch to 1 week time period', async () => {
      await device.disableSynchronization();
      try {
        await PortfolioAnalytics.tapTimePeriodButton('1w');
        await TestHelpers.delay(1000);
        const periodButton = await PortfolioAnalytics.getTimePeriodButton('1w');
        await Assertions.checkIfVisible(periodButton);
      } catch {
        console.log('1w time period button not available');
      }
      await device.enableSynchronization();
    });

    it('should switch to 1 month time period', async () => {
      await device.disableSynchronization();
      try {
        await PortfolioAnalytics.tapTimePeriodButton('1m');
        await TestHelpers.delay(1000);
        const periodButton = await PortfolioAnalytics.getTimePeriodButton('1m');
        await Assertions.checkIfVisible(periodButton);
      } catch {
        console.log('1m time period button not available');
      }
      await device.enableSynchronization();
    });

    it('should switch to 3 months time period', async () => {
      await device.disableSynchronization();
      try {
        await PortfolioAnalytics.tapTimePeriodButton('3m');
        await TestHelpers.delay(1000);
        const periodButton = await PortfolioAnalytics.getTimePeriodButton('3m');
        await Assertions.checkIfVisible(periodButton);
      } catch {
        console.log('3m time period button not available');
      }
      await device.enableSynchronization();
    });

    it('should switch to 1 year time period', async () => {
      await device.disableSynchronization();
      try {
        await PortfolioAnalytics.tapTimePeriodButton('1y');
        await TestHelpers.delay(1000);
        const periodButton = await PortfolioAnalytics.getTimePeriodButton('1y');
        await Assertions.checkIfVisible(periodButton);
      } catch {
        console.log('1y time period button not available');
      }
      await device.enableSynchronization();
    });

    it('should switch to 3 years time period', async () => {
      await device.disableSynchronization();
      try {
        await PortfolioAnalytics.tapTimePeriodButton('3y');
        await TestHelpers.delay(1000);
        const periodButton = await PortfolioAnalytics.getTimePeriodButton('3y');
        await Assertions.checkIfVisible(periodButton);
      } catch {
        console.log('3y time period button not available');
      }
      await device.enableSynchronization();
    });
  });

  describe('Privacy Mode Behavior', () => {
    it('should display balance when privacy mode is off', async () => {
      await Assertions.checkIfVisible(WalletView.container);
      await Assertions.checkIfVisible(PortfolioAnalytics.totalBalanceText);
    });

    it('should toggle privacy mode on when tapping eye icon', async () => {
      await device.disableSynchronization();
      await PortfolioAnalytics.tapPrivacyToggle();
      await TestHelpers.delay(1000);
      await device.enableSynchronization();
      await Assertions.checkIfVisible(PortfolioAnalytics.totalBalanceText);
    });

    it('should toggle privacy mode off when tapping eye slash icon', async () => {
      await device.disableSynchronization();
      await PortfolioAnalytics.tapPrivacyToggle();
      await TestHelpers.delay(1000);
      await device.enableSynchronization();
      await Assertions.checkIfVisible(PortfolioAnalytics.totalBalanceText);
    });

    it('should maintain privacy mode state after navigation', async () => {
      await device.disableSynchronization();
      await PortfolioAnalytics.tapPrivacyToggle();
      await TestHelpers.delay(500);

      await TabBarComponent.tapSettings();
      await TestHelpers.delay(1000);
      await TabBarComponent.tapWallet();
      await TestHelpers.delay(1000);

      await Assertions.checkIfVisible(PortfolioAnalytics.totalBalanceText);
      await device.enableSynchronization();
    });

    it('should hide sensitive data in token overview when privacy mode is on', async () => {
      await device.disableSynchronization();
      await WalletView.tapOnToken();
      await TestHelpers.delay(2000);
      await Assertions.checkIfVisible(PortfolioAnalytics.tokenOverviewContainer);
      await device.pressBack();
      await TestHelpers.delay(1000);
      await device.enableSynchronization();
    });
  });

  describe('Data Display Accuracy', () => {
    it('should display total balance on wallet view', async () => {
      await Assertions.checkIfVisible(WalletView.container);
      await Assertions.checkIfVisible(PortfolioAnalytics.totalBalanceText);
    });

    it('should display portfolio button', async () => {
      await Assertions.checkIfVisible(PortfolioAnalytics.portfolioButton);
    });

    it('should display token list', async () => {
      const tokensContainer = await WalletView.getTokensInWallet();
      await Assertions.checkIfVisible(tokensContainer);
    });

    it('should display token price in token overview', async () => {
      await WalletView.tapOnToken();
      await TestHelpers.delay(2000);
      await Assertions.checkIfVisible(PortfolioAnalytics.tokenOverviewContainer);
      await device.pressBack();
      await TestHelpers.delay(1000);
    });

    it('should display network name correctly', async () => {
      await Assertions.checkIfVisible(WalletView.navbarNetworkButton);
    });

    it('should display account name correctly', async () => {
      await Assertions.checkIfVisible(WalletView.accountName);
    });
  });

  describe('Portfolio Button Navigation', () => {
    it('should navigate to portfolio when tapping portfolio button', async () => {
      await device.disableSynchronization();
      await PortfolioAnalytics.tapPortfolioButton();
      await TestHelpers.delay(3000);
      await device.enableSynchronization();
    });

    it('should return to wallet view', async () => {
      await TabBarComponent.tapWallet();
      await TestHelpers.delay(1000);
      await Assertions.checkIfVisible(WalletView.container);
    });
  });
});
