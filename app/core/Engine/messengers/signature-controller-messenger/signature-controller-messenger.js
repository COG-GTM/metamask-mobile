























export function getSignatureControllerMessenger(
messenger)
{
  return messenger.getRestricted({
    name: 'SignatureController',
    allowedActions: [
    'AccountsController:getState',
    'ApprovalController:addRequest',
    'LoggingController:add',
    'NetworkController:getNetworkClientById',
    'KeyringController:signMessage',
    'KeyringController:signPersonalMessage',
    'KeyringController:signTypedMessage'],

    allowedEvents: []
  });
}