import type {
  TokenRatesControllerEvents,
} from '@metamask/assets-controllers';
import type {
  TransactionControllerTransactionConfirmedEvent,
  TransactionControllerTransactionDroppedEvent,
  TransactionControllerTransactionFailedEvent,
} from '@metamask/transaction-controller';
import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import type {
  PortfolioAnalyticsControllerActions,
  PortfolioAnalyticsControllerEvents,
} from '../../controllers/portfolio-analytics-controller/PortfolioAnalyticsController';

const name = 'PortfolioAnalyticsController';

type MessengerActions = PortfolioAnalyticsControllerActions;

type MessengerEvents = PortfolioAnalyticsControllerEvents;

export type PortfolioAnalyticsControllerMessenger = RestrictedMessenger<
  typeof name,
  MessengerActions,
  MessengerEvents,
  MessengerActions['type'],
  MessengerEvents['type']
>;

export function getPortfolioAnalyticsControllerMessenger(
  messenger: Messenger<MessengerActions, MessengerEvents>,
): PortfolioAnalyticsControllerMessenger {
  return messenger.getRestricted({
    name: 'PortfolioAnalyticsController',
    allowedActions: [],
    allowedEvents: [],
  });
}

type InitMessengerEvents =
  | TransactionControllerTransactionConfirmedEvent
  | TransactionControllerTransactionDroppedEvent
  | TransactionControllerTransactionFailedEvent
  | TokenRatesControllerEvents;

export type PortfolioAnalyticsControllerInitMessenger = RestrictedMessenger<
  'PortfolioAnalyticsControllerInit',
  never,
  InitMessengerEvents,
  never,
  InitMessengerEvents['type']
>;

export function getPortfolioAnalyticsControllerInitMessenger(
  messenger: Messenger<never, InitMessengerEvents>,
): PortfolioAnalyticsControllerInitMessenger {
  return messenger.getRestricted({
    name: 'PortfolioAnalyticsControllerInit',
    allowedActions: [],
    allowedEvents: [
      'TransactionController:transactionConfirmed',
      'TransactionController:transactionDropped',
      'TransactionController:transactionFailed',
      'TokenRatesController:stateChange',
    ],
  });
}
