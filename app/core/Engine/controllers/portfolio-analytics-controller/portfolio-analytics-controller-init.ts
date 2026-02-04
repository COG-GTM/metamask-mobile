import type { TransactionMeta } from '@metamask/transaction-controller';
import type { TokenRatesControllerState } from '@metamask/assets-controllers';

import type {
  ControllerInitFunction,
  ControllerInitRequest,
} from '../../types';
import Logger from '../../../../util/Logger';
import {
  PortfolioAnalyticsController,
  type PortfolioAnalyticsControllerMessenger,
} from './PortfolioAnalyticsController';
import type { PortfolioAnalyticsControllerInitMessenger } from '../../messengers/portfolio-analytics-controller-messenger/portfolio-analytics-controller-messenger';

export const PortfolioAnalyticsControllerInit: ControllerInitFunction<
  PortfolioAnalyticsController,
  PortfolioAnalyticsControllerMessenger,
  PortfolioAnalyticsControllerInitMessenger
> = (request) => {
  const { controllerMessenger, initMessenger, persistedState } = request;

  try {
    const portfolioAnalyticsController = new PortfolioAnalyticsController({
      messenger: controllerMessenger,
      state: persistedState.PortfolioAnalyticsController,
    });

    addPortfolioAnalyticsControllerListeners({
      initMessenger,
      portfolioAnalyticsController,
    });

    return { controller: portfolioAnalyticsController };
  } catch (error) {
    Logger.error(
      error as Error,
      'Failed to initialize PortfolioAnalyticsController',
    );
    throw error;
  }
};

function addPortfolioAnalyticsControllerListeners({
  initMessenger,
  portfolioAnalyticsController,
}: {
  initMessenger: PortfolioAnalyticsControllerInitMessenger;
  portfolioAnalyticsController: PortfolioAnalyticsController;
}) {
  initMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    (transactionMeta: TransactionMeta) => {
      portfolioAnalyticsController.recordTransactionFinished(transactionMeta);
    },
  );

  initMessenger.subscribe(
    'TransactionController:transactionDropped',
    ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
      portfolioAnalyticsController.recordTransactionFinished(transactionMeta);
    },
  );

  initMessenger.subscribe(
    'TransactionController:transactionFailed',
    ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
      portfolioAnalyticsController.recordTransactionFinished(transactionMeta);
    },
  );

  initMessenger.subscribe(
    'TokenRatesController:stateChange',
    (tokenRatesState: TokenRatesControllerState) => {
      portfolioAnalyticsController.recordTokenRatesUpdate(tokenRatesState);
    },
  );
}
