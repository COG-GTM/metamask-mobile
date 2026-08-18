'use strict';
import { SmokeWalletPlatform } from '../../tags';
import TestHelpers from '../../helpers';
import { loginToApp } from '../../viewHelper';
import Assertions from '../../utils/Assertions';
import { mockEvents } from '../../api-mocking/mock-config/mock-events';
import { withFixtures } from '../../fixtures/fixture-helper';
import FixtureBuilder, {
  DEFAULT_FIXTURE_ACCOUNT,
} from '../../fixtures/fixture-builder';
import ActivitiesView from '../../pages/Transactions/ActivitiesView';
import { ActivitiesViewSelectorsText } from '../../selectors/Transactions/ActivitiesView.selectors';
import TabBarComponent from '../../pages/wallet/TabBarComponent';

const TOKEN_SYMBOL = 'ABC';
const TOKEN_ADDRESS = '0x123';
const COUNTERPARTY_ADDRESS = '0x2';

const BASE_TRANSACTION_MOCK = {
  hash: '0x123456',
  timestamp: new Date().toISOString(),
  chainId: 1,
  blockNumber: 1,
  blockHash: '0x2',
  gas: 1,
  gasUsed: 1,
  gasPrice: '1',
  effectiveGasPrice: '1',
  nonce: 1,
  cumulativeGasUsed: 1,
  methodId: null,
  value: '1230000000000000000',
  to: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
  from: COUNTERPARTY_ADDRESS,
  isError: false,
  valueTransfers: [],
};

const INCOMING_ETH_MOCK = { ...BASE_TRANSACTION_MOCK };

const OUTGOING_ETH_MOCK = {
  ...BASE_TRANSACTION_MOCK,
  hash: '0x2',
  nonce: 2,
  value: '2340000000000000000',
  to: COUNTERPARTY_ADDRESS,
  from: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
};

const INCOMING_TOKEN_MOCK = {
  ...BASE_TRANSACTION_MOCK,
  hash: '0x3',
  nonce: 3,
  to: COUNTERPARTY_ADDRESS,
  valueTransfers: [
    {
      contractAddress: TOKEN_ADDRESS,
      decimal: 18,
      symbol: TOKEN_SYMBOL,
      from: COUNTERPARTY_ADDRESS,
      to: DEFAULT_FIXTURE_ACCOUNT.toLowerCase(),
      amount: '4560000000000000000',
    },
  ],
};

const TRANSACTIONS = [
  INCOMING_ETH_MOCK,
  OUTGOING_ETH_MOCK,
  INCOMING_TOKEN_MOCK,
];

function mockAccountsApi(transactions) {
  return {
    urlEndpoint: `https://accounts.api.cx.metamask.io/v1/accounts/${DEFAULT_FIXTURE_ACCOUNT}/transactions?networks=0x1,0x89,0x38,0xe708,0x2105,0xa,0xa4b1,0x82750&sortDirection=ASC`,
    response: {
      data: transactions,
      pageInfo: {
        count: transactions.length,
        hasNextPage: false,
      },
    },
    responseCode: 200,
  };
}

/**
 * Search and filter flow for the Activity tab.
 *
 * The control bar this exercises is delivered by the Activity search UI work;
 * until that lands the spec fails at the first control bar assertion, which is
 * the intended signal that the UI is not wired up yet.
 */
describe(SmokeWalletPlatform('Activity search and filters'), () => {
  beforeAll(async () => {
    jest.setTimeout(2500000);
    await TestHelpers.reverseServerPort();
  });

  it('narrows the activity list by query and by type, then restores it', async () => {
    await withFixtures(
      {
        fixture: new FixtureBuilder()
          .withTokens([
            {
              address: TOKEN_ADDRESS,
              decimals: 18,
              symbol: TOKEN_SYMBOL,
            },
          ])
          .build(),
        restartDevice: true,
        testSpecificMock: {
          GET: [
            mockEvents.GET.remoteFeatureFlagsActivitySearch,
            mockAccountsApi(TRANSACTIONS),
          ],
        },
      },
      async () => {
        await loginToApp();
        await TabBarComponent.tapActivity();
        await ActivitiesView.swipeDown();

        // Baseline: every transaction is listed and the control bar is present.
        await Assertions.checkIfVisible(ActivitiesView.controlBar);
        await Assertions.checkIfVisible(ActivitiesView.searchInput);
        await Assertions.checkIfTextIsDisplayed(`Received ${TOKEN_SYMBOL}`);
        await Assertions.checkIfTextIsDisplayed('Received ETH');
        await Assertions.checkIfTextIsDisplayed('Sent ETH');

        // Search narrows the list to the matching token transfer.
        await ActivitiesView.typeSearchQuery(TOKEN_SYMBOL);
        await Assertions.checkIfTextIsDisplayed(`Received ${TOKEN_SYMBOL}`);
        await Assertions.checkIfTextIsNotDisplayed('Sent ETH');

        // Clearing the query brings the full list back.
        await ActivitiesView.clearSearchQuery();
        await Assertions.checkIfTextIsDisplayed('Sent ETH');

        // A type filter narrows the list by composition, not by text.
        await ActivitiesView.tapTypeFilterChip();
        await Assertions.checkIfVisible(ActivitiesView.filtersBottomSheet);
        await ActivitiesView.tapFilterOption(
          ActivitiesViewSelectorsText.FILTER_TYPE_SEND,
        );
        await Assertions.checkIfTextIsDisplayed('Sent ETH');
        await Assertions.checkIfTextIsNotDisplayed('Received ETH');
        await Assertions.checkIfTextIsNotDisplayed(`Received ${TOKEN_SYMBOL}`);
        await Assertions.checkIfVisible(ActivitiesView.activeFilterToken);

        // Clear all restores the original, unfiltered list.
        await ActivitiesView.tapClearAllFilters();
        await Assertions.checkIfTextIsDisplayed('Sent ETH');
        await Assertions.checkIfTextIsDisplayed('Received ETH');
        await Assertions.checkIfTextIsDisplayed(`Received ${TOKEN_SYMBOL}`);
        await Assertions.checkIfNotVisible(ActivitiesView.activeFilterToken);
      },
    );
  });
});
