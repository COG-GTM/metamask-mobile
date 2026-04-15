import Engine from '../../core/Engine';
import Logger from '../Logger';

const LOG_PREFIX = 'Swaps Transactions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any


export function addSwapsTransaction(
transactionId,
data)
{
  const { TransactionController } = Engine.context;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TransactionController.update((state) => {
    if (!state.swapsTransactions) {
      state.swapsTransactions = {};
    }

    state.swapsTransactions[transactionId] = data;
  });

  Logger.log(LOG_PREFIX, 'Added transaction', transactionId);
}

export function updateSwapsTransaction(
transactionId,
callback)
{
  const { TransactionController } = Engine.context;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TransactionController.update((state) => {
    const existingData = state.swapsTransactions?.[transactionId];

    if (!existingData) {
      throw new Error(`Swaps transaction not found - ${transactionId}`);
    }

    callback(existingData);
  });

  Logger.log(LOG_PREFIX, 'Updated transaction', transactionId);
}