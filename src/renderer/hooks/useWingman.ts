import { useCallback } from 'react';

export function useWingman() {
  const loadUrl = useCallback((url: string): string | null => {
    const q0 = url.trim();
    if (!q0) return null;
    let q = q0;
    const isUrl = /^(https?:\/\/)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i.test(q) && !q.includes(' ');
    if (isUrl) {
      if (!/^https?:\/\//i.test(q)) q = 'https://' + q;
    } else {
      q = `https://www.bing.com/search?q=${encodeURIComponent(q)}`;
    }
    return q;
  }, []);

  return { loadUrl };
}
