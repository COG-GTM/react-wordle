import { useState, useRef, useCallback } from 'react';

const useTimer = () => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const intervalRef = useRef(null);
  const isRunningRef = useRef(false);

  const start = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
  }, []);

  const stop = useCallback(() => {
    if (!isRunningRef.current) return;
    isRunningRef.current = false;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setElapsedTime(0);
  }, [stop]);

  return {
    elapsedTime,
    start,
    stop,
    reset,
    isRunning: isRunningRef.current,
  };
};

export default useTimer;
