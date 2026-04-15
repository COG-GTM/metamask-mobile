import { useRef, useEffect } from 'react';






function useInterval(callback, options) {
  const { delay = null, immediate = false } = options;

  const savedCallback = useRef();
  // Remember the latest function.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    if (delay !== null && delay > 0) {
      if (immediate) {
        tick();
      }
      const id = setInterval(tick, delay);

      return () => clearInterval(id);
    }
  }, [delay, immediate]);
}

export default useInterval;