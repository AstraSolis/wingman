import { useState, useCallback } from 'react';

interface OSDMessage {
  text: string;
  id: number;
}

export function useOSD() {
  const [osdMessage, setOsdMessage] = useState<OSDMessage | null>(null);

  const showOSD = useCallback((msg: string) => setOsdMessage({ text: msg, id: Date.now() }), []);

  return { osdMessage, showOSD };
}
