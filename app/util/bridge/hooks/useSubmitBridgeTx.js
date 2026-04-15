
import Engine from '../../../core/Engine';

import { useSelector } from 'react-redux';
import { selectSmartTransactionsEnabled } from '../../../selectors/smartTransactionsController';

export default function useSubmitBridgeTx() {
  const stxEnabled = useSelector(selectSmartTransactionsEnabled);

  const submitBridgeTx = async ({
    quoteResponse


  }) => {
    const txResult = await Engine.context.BridgeStatusController.submitTx(quoteResponse, stxEnabled);

    return txResult;
  };

  return { submitBridgeTx };
}