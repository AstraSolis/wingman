import { useState, useCallback } from 'react';

export function useOSD() {
  const [osdMessage, setOsdMessage] = useState(null);

  const showOSD = useCallback((msg) => setOsdMessage({ text: msg, id: Date.now() }), []);

  return { osdMessage, showOSD };
}
