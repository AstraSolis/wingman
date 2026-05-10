import { useState, useCallback, useEffect } from 'react';

export function useWindowBind() {
  const [boundWindows, setBoundWindowsState] = useState<string[]>([]);

  useEffect(() => {
    window.wingman.windowTracker.getBoundWindows().then((windows) => {
      setBoundWindowsState(windows);
    });
  }, []);

  const setBindings = useCallback(async (titles: string[]) => {
    const updated = await window.wingman.windowTracker.setBoundWindows(titles);
    setBoundWindowsState(updated);
  }, []);

  return { boundWindows, setBindings };
}
