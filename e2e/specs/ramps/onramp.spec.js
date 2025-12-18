'use strict';
import { loginToApp } from '../../viewHelper';
import TabBarComponent from '../../pages/wallet/TabBarComponent';
import WalletActionsBottomSheet from '../../pages/wallet/WalletActionsBottomSheet';
import FixtureBuilder from '../../fixtures/fixture-builder';
import {
  loadFixture,
  startFixtureServer,
  stopFixtureServer,
} from '../../fixtures/fixture-helper';
import TestHelpers from '../../helpers';
import FixtureServer from '../../fixtures/fixture-server';
import { getFixturesServerPort } from '../../fixtures/utils';
import { SmokeTrade } from '../../tags';
import BuyGetStartedView from '../../pages/Ramps/BuyGetStartedView';
import SelectRegionView from '../../pages/Ramps/SelectRegionView';
import SelectPaymentMethodView from '../../pages/Ramps/SelectPaymentMethodView';
import BuildQuoteView from '../../pages/Ramps/BuildQuoteView';
import QuotesView from '../../pages/Ramps/QuotesView';
import Assertions from '../../utils/Assertions';
import TokenSelectBottomSheet from '../../pages/Ramps/TokenSelectBottomSheet';
import SelectCurrencyView from '../../pages/Ramps/SelectCurrencyView';
const fixtureServer = new FixtureServer();

describe(SmokeTrade('Buy Crypto'), () => {
  beforeAll(async () => {
    await TestHelpers.reverseServerPort();
    const fixture = new FixtureBuilder().build();
    await startFixtureServer(fixtureServer);
    await loadFixture(fixtureServer, { fixture });
    await TestHelpers.launchApp({
      permissions: { notifications: 'YES' },
      launchArgs: { fixtureServerPort: `${getFixturesServerPort()}` },
    });
    await loginToApp();
  });

  afterAll(async () => {
    await stopFixtureServer(fixtureServer);
  });

  beforeEach(async () => {
    jest.setTimeout(150000);
  });

  it('should select Region to see the Build Buy Quote screen', async () => {
    await TabBarComponent.tapWallet();
    await TabBarComponent.tapActions();
    await WalletActionsBottomSheet.tapBuyButton();
    await BuyGetStartedView.tapGetStartedButton();
    await BuildQuoteView.tapSelectRegionDropdown();
    await SelectRegionView.tapRegionOption('United States of America');
    await SelectRegionView.tapRegionOption('California');
    await SelectRegionView.tapContinueButton();
    await Assertions.checkIfVisible(BuildQuoteView.amountToBuyLabel);
    await Assertions.checkIfVisible(BuildQuoteView.getQuotesButton);
    await BuildQuoteView.tapCancelButton();
  });

  it('should skip to the Build Quote screen for returning user', async () => {
    await TabBarComponent.tapActions();
    await WalletActionsBottomSheet.tapBuyButton();
    await Assertions.checkIfVisible(BuildQuoteView.amountToBuyLabel);
    await Assertions.checkIfVisible(BuildQuoteView.getQuotesButton);
    await BuildQuoteView.tapCancelButton();
  });

  it('should change parameters and select a quote', async () => {
    const platform = device.getPlatform();

    let paymentMethod;
    if (platform === 'ios') {
      try {
        const applePayVisible = await Assertions.checkIfTextIsDisplayed('Apple Pay', 5000);
        paymentMethod = applePayVisible ? 'Apple Pay' : 'Debit or Credit';
      } catch {
        paymentMethod = 'Debit or Credit';
      }
    } else if (platform === 'android') {
      try {
        const googlePayVisible = await Assertions.checkIfTextIsDisplayed('Google Pay', 5000);
        paymentMethod = googlePayVisible ? 'Google Pay' : 'Debit or Credit';
      } catch {
        paymentMethod = 'Debit or Credit';
      }
    } else {
      paymentMethod = 'Debit or Credit';
    }
    await TabBarComponent.tapActions();
    await WalletActionsBottomSheet.tapBuyButton();
    await TestHelpers.delay(2000);
    await BuildQuoteView.tapCurrencySelector();
    await SelectCurrencyView.tapCurrencyOption('Euro');
    await TestHelpers.delay(1000);
    await BuildQuoteView.tapTokenDropdown('Ethereum');
    await TokenSelectBottomSheet.tapTokenByName('DAI');
    await TestHelpers.delay(1000);
    await BuildQuoteView.tapRegionSelector();
    await SelectRegionView.tapRegionOption('France');
    await TestHelpers.delay(1000);
    await BuildQuoteView.tapPaymentMethodDropdown(paymentMethod);
    await SelectPaymentMethodView.tapPaymentMethodOption('Debit or Credit');
    await TestHelpers.delay(2000);
    await Assertions.checkIfTextIsDisplayed('€0', 30000);
    await Assertions.checkIfTextIsNotDisplayed('$0', 30000);
    await Assertions.checkIfTextIsDisplayed('Dai Stablecoin', 30000);
    await Assertions.checkIfTextIsNotDisplayed('Ethereum', 30000);
    await Assertions.checkIfTextIsDisplayed('Debit or Credit', 30000);
    await Assertions.checkIfTextIsDisplayed('🇫🇷', 30000);
    await BuildQuoteView.enterAmount('100');
    await TestHelpers.delay(2000);
    await BuildQuoteView.tapGetQuotesButton();
    await Assertions.checkIfVisible(QuotesView.quotes, 60000);
    await QuotesView.closeQuotesSection();
    await BuildQuoteView.tapCancelButton();
  });
});
