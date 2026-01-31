import { useEffect, useRef } from 'react';

export function usePolling(
  callback: () => void | Promise<void>,
  interval: number = 3000,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const execute = async () => {
      await callbackRef.current();
    };

    // Execute immediately
    execute();

    // Then set up interval
    intervalRef.current = setInterval(execute, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);
}
