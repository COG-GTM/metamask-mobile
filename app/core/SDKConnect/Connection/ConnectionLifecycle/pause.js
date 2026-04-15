

function pause({ instance }) {
  instance.remote.pause();
  instance.isResumed = false;
}

export default pause;