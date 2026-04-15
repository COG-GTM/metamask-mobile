import DevLogger from '../../utils/DevLogger';


function resume({ instance }) {
  DevLogger.log(`Connection::resume() id=${instance.channelId}`);

  instance.remote.resume();

  instance.isResumed = true;

  instance.setLoading(false);
}

export default resume;