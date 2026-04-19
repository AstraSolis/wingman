import { useState, useMemo } from 'react';
import type { TFunction } from '../hooks/useI18n';

const closeIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const trashIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

function getFaviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

// 根据字符串生成一个固定颜色（用于首字母头像）
function getAvatarColor(str: string): string {
  const colors = ['#6c8cff', '#ff6b9d', '#ffa26b', '#51cf66', '#a26bff', '#ff6b6b', '#20c997'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function FaviconAvatar({ url, title }: { url: string; title: string }) {
  const [failed, setFailed] = useState(false);
  const faviconUrl = getFaviconUrl(url);
  const letter = (title || url).charAt(0).toUpperCase();
  const color = getAvatarColor(url);

  if (!faviconUrl || failed) {
    return (
      <div className="lml-avatar" style={{ background: color + '22', color }}>
        <span>{letter}</span>
      </div>
    );
  }
  return (
    <div className="lml-avatar lml-avatar-img">
      <img src={faviconUrl} alt="" onError={() => setFailed(true)} width={18} height={18} />
    </div>
  );
}

interface ListModalProps {
  title: string;
  items: WingmanUserDataItem[];
  type: 'favorites' | 'history';
  onSelect: (item: WingmanUserDataItem) => void;
  onDelete?: (item: WingmanUserDataItem) => void;
  onClose: () => void;
  t: TFunction;
}

export default function ListModal({ title, items, type, onSelect, onDelete, onClose, t }: ListModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items ?? [];
    const kw = query.toLowerCase();
    return (items ?? []).filter(
      (item) => item.title?.toLowerCase().includes(kw) || item.url.toLowerCase().includes(kw)
    );
  }, [items, query]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lml-modal">
        {/* 头部 */}
        <div className="lml-header">
          <span className="lml-title">{title}</span>
          <button className="lml-close-btn" onClick={onClose}>{closeIcon}</button>
        </div>

        {/* 搜索框 */}
        <div className="lml-search-wrap">
          <input
            className="lml-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            spellCheck={false}
          />
        </div>

        {/* 列表 */}
        <div className="lml-list">
          {!filtered.length ? (
            <div className="lml-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.25">
                {type === 'favorites'
                  ? <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  : <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>}
              </svg>
              <span>{t('home.emptyList')}</span>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.url} className="lml-item" onClick={() => onSelect(item)}>
                <FaviconAvatar url={item.url} title={item.title || ''} />
                <div className="lml-item-text">
                  <div className="lml-item-title">{item.title || t('home.unknownTitle')}</div>
                  <div className="lml-item-url">{item.url}</div>
                </div>
                {type === 'favorites' && (
                  <button
                    className="lml-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDelete?.(item); }}
                  >
                    {trashIcon}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
