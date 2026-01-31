import { useCallback, useRef, useState } from "react";

const MINIMUM_LOADING_DURATION = 300;

export function useMinimumLoading(minimumDuration = MINIMUM_LOADING_DURATION) {
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef<number | null>(null);

  const startLoading = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(async () => {
    if (startTimeRef.current === null) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = minimumDuration - elapsed;

    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }

    setIsLoading(false);
    startTimeRef.current = null;
  }, [minimumDuration]);

  return { isLoading, startLoading, stopLoading };
}
