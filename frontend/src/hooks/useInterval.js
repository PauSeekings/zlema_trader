import { useEffect, useRef } from 'react';

export const useInterval = (callback, delay) => {
  const savedCallback = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
};

export const useAutoRefresh = (fetchFunction, interval = 5000, dependencies = []) => {
  useInterval(() => {
    if (fetchFunction) {
      fetchFunction();
    }
  }, interval);

  // Initial fetch when dependencies change
  useEffect(() => {
    if (fetchFunction) {
      fetchFunction();
    }
  }, dependencies);
};