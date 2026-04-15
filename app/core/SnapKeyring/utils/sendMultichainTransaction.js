import { HandlerType } from '@metamask/snaps-utils';
import { handleSnapRequest } from '../../Snaps/utils';
import Engine from '../../Engine';


const controllerMessenger = Engine.controllerMessenger;

export async function sendMultichainTransaction(
snapId,
{
  account,
  scope



})
{
  await handleSnapRequest(controllerMessenger, {
    snapId,
    origin: 'metamask',
    handler: HandlerType.OnRpcRequest,
    request: {
      method: 'startSendTransactionFlow',
      params: {
        account,
        scope
      }
    }
  });
}