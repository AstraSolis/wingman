import { useCallback, useEffect, useRef } from 'react';
import { SEARCH_ENGINES } from '../../common/constants';

function buildSearchUrl(engine: string, customUrl: string, query: string): string {
  const encoded = encodeURIComponent(query);
  switch (engine) {
    case SEARCH_ENGINES.GOOGLE:
      return `https://www.google.com/search?q=${encoded}`;
    case SEARCH_ENGINES.BAIDU:
      return `https://www.baidu.com/s?wd=${encoded}`;
    case SEARCH_ENGINES.CUSTOM:
      return customUrl.includes('{query}')
        ? customUrl.replace('{query}', encoded)
        : `${customUrl}${encoded}`;
    default:
      return `https://www.bing.com/search?q=${encoded}`;
  }
}

export function useWingman(searchEngine: string = SEARCH_ENGINES.BING, customSearchUrl = '') {
  const engineRef = useRef(searchEngine);
  const customUrlRef = useRef(customSearchUrl);

  useEffect(() => {
    engineRef.current = searchEngine;
    customUrlRef.current = customSearchUrl;
  }, [searchEngine, customSearchUrl]);

  const loadUrl = useCallback((url: string): string | null => {
    const q0 = url.trim();
    if (!q0) return null;
    let q = q0;
    const isUrl = /^(https?:\/\/)|([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)/i.test(q) && !q.includes(' ');
    if (isUrl) {
      if (!/^https?:\/\//i.test(q)) q = 'https://' + q;
    } else {
      q = buildSearchUrl(engineRef.current, customUrlRef.current, q);
    }
    return q;
  }, []);

  return { loadUrl };
}
