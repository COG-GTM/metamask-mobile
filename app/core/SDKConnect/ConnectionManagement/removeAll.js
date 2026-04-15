import {
  resetDappConnections,
  resetApprovedHosts,
  resetConnections } from
'../../../../app/actions/sdk';
import { store } from '../../../../app/store';


async function removeAll(instance) {
  const removeChannels = async (connections) => {
    try {
      await Promise.all(
        Object.keys(connections).map((id) =>
        instance.removeChannel({
          channelId: id,
          sendTerminate: true
        })
        )
      );
      return true;
    } catch (error) {
      console.error('Error removing channels:', error);
      return false;
    }
  };

  try {
    // Remove current connections and dapp connections in parallel
    const [currentRemoved, dappRemoved] = await Promise.all([
    removeChannels(instance.state.connections),
    removeChannels(await instance.loadDappConnections())]
    );

    if (currentRemoved && dappRemoved) {
      // Reset state
      instance.state = {
        ...instance.state,
        approvedHosts: {},
        disabledHosts: {},
        connections: {},
        dappConnections: {},
        connected: {},
        connecting: {},
        paused: false
      };

      // Dispatch reset actions
      store.dispatch(resetConnections({}));
      store.dispatch(resetApprovedHosts({}));
      store.dispatch(resetDappConnections({}));

      return true;
    }
    console.error('Failed to remove all connections');
    return false;

  } catch (error) {
    console.error('Error in removeAll:', error);
    return false;
  }
}

export default removeAll;