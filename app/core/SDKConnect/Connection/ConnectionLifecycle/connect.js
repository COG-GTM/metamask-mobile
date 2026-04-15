import DevLogger from '../../utils/DevLogger';


async function connect({
  withKeyExchange,
  instance,
  authorized





}) {
  DevLogger.log(
    `Connection::connect() id=${instance.channelId} withKeyExchange=${withKeyExchange} authorized=${authorized}`
  );
  await instance.remote.connectToChannel({
    channelId: instance.channelId,
    authorized,
    withKeyExchange
  });
  instance.receivedDisconnect = false;
}

export default connect;