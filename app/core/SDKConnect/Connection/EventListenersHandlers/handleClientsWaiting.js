import DevLogger from '../../utils/DevLogger';


function handleClientsWaiting({ instance }) {
  return () => {
    DevLogger.log(
      `handleClientsWaiting:: dapp not connected`,
      instance.channelId
    );
    instance.setLoading(false);
    // TODO - validate connection behavior if disconnect or maintain. Keeping it for now
    // instance.disconnect({ terminate: false, context: 'CLIENTS_WAITING' });
  };
}

export default handleClientsWaiting;