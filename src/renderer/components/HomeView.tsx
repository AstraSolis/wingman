import { useState, useEffect, useRef } from 'react';
import type { TFunction } from '../hooks/useI18n';
import ContextMenu from './ContextMenu';

interface HomeViewProps {
  onNavigate: (url: string) => void;
  onFavorites: () => void;
  onHistory: () => void;
  onSettings: () => void;
  showOSD?: (msg: string) => void;
  t: TFunction;
}

function getFavicon(url: string): string {
  try {
    const hostname = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
  } catch {
    return '';
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname.replace('www.', '');
  } catch {
    return url.slice(0, 16);
  }
}

export default function HomeView({ onNavigate, onFavorites, onHistory, onSettings, showOSD, t }: HomeViewProps) {
  const [time, setTime] = useState('');
  const [input, setInput] = useState('');
  const [dockItems, setDockItems] = useState<WingmanDockItem[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [addUrl, setAddUrl] = useState('');
  const [addTitle, setAddTitle] = useState('');
  const [editingItem, setEditingItem] = useState<WingmanDockItem | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [faviconErrors, setFaviconErrors] = useState<Set<string>>(new Set());
  const [dockCtxMenu, setDockCtxMenu] = useState<{ x: number; y: number; item: WingmanDockItem } | null>(null);
  const [bgCtxMenu, setBgCtxMenu] = useState<{ x: number; y: number } | null>(null);

  const addWrapperRef = useRef<HTMLDivElement>(null);
  const addUrlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(
        `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    window.wingman.dock.getItems().then(setDockItems);
  }, []);

  useEffect(() => {
    if (!addOpen) return;
    const handler = (e: MouseEvent) => {
      if (addWrapperRef.current && !addWrapperRef.current.contains(e.target as Node)) {
        setAddOpen(false);
        setEditingItem(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [addOpen]);

  useEffect(() => {
    if (addOpen) addUrlInputRef.current?.focus();
  }, [addOpen]);

  const handleGo = () => {
    if (input) onNavigate(input);
  };

  const handleAddDockItem = async () => {
    const trimmed = addUrl.trim();
    if (!trimmed) return;
    const title = addTitle.trim() || getDomain(trimmed);
    let items: WingmanDockItem[];
    if (editingItem) {
      items = await window.wingman.dock.updateItem({ id: editingItem.id, title, url: trimmed });
    } else {
      items = await window.wingman.dock.addItem({ title, url: trimmed });
    }
    setDockItems(items);
    setAddUrl('');
    setAddTitle('');
    setAddOpen(false);
    setEditingItem(null);
  };

  const handleRemoveDockItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const items = await window.wingman.dock.removeItem(id);
    setDockItems(items);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (dockCtxMenu) { e.preventDefault(); return; }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newItems = [...dockItems];
    const [moved] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, moved);
    setDockItems(newItems);
    const updated = await window.wingman.dock.reorderItems(newItems.map((it) => it.id));
    setDockItems(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleFaviconError = (id: string) => {
    setFaviconErrors((prev) => new Set(prev).add(id));
  };

  return (
    <div
      className="home-view"
      onContextMenu={(e) => {
        e.preventDefault();
        setDockCtxMenu(null);
        setBgCtxMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      <div
        className="home-bg"
        style={{ backgroundImage: "url('https://api.dujin.org/bing/1920.php')" }}
      />
      <div className="home-bg-overlay" />
      <div className="home-content">
        <div className="home-clock">{time}</div>
        <div className="home-search">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGo()}
            placeholder={t('home.searchPlaceholder')}
            spellCheck={false}
          />
          <button onClick={handleGo}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>
      </div>

      <div className="home-dock-container">
        <div className="home-dock">
          {/* 收藏夹 */}
          <button className="dock-item" title={t('home.favorites')} onClick={onFavorites}>
            <div className="dock-icon dock-icon-builtin">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <span className="dock-label">{t('home.favorites')}</span>
          </button>

          {/* 历史记录 */}
          <button className="dock-item" title={t('home.history')} onClick={onHistory}>
            <div className="dock-icon dock-icon-builtin">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="dock-label">{t('home.history')}</span>
          </button>

          {/* 分隔符 */}
          {dockItems.length > 0 && <div className="dock-sep" />}

          {/* 自定义网站 */}
          {dockItems.map((item, index) => (
            <div
              key={item.id}
              className={[
                'dock-item',
                'dock-site',
                draggedIndex === index ? 'dock-dragging' : '',
                dragOverIndex === index && draggedIndex !== index ? 'dock-drag-over' : ''
              ]
                .filter(Boolean)
                .join(' ')}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onNavigate(item.url)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setBgCtxMenu(null);
                setDockCtxMenu({ x: e.clientX, y: e.clientY, item });
              }}
              title={item.title}
            >
              <div className="dock-icon">
                {faviconErrors.has(item.id) ? (
                  <span className="dock-icon-fallback-letter">
                    {item.title[0]?.toUpperCase() ?? '?'}
                  </span>
                ) : (
                  <img
                    src={getFavicon(item.url)}
                    alt={item.title}
                    onError={() => handleFaviconError(item.id)}
                  />
                )}
              </div>
              <span className="dock-label">{item.title}</span>
              <button
                className="dock-item-del"
                onClick={(e) => handleRemoveDockItem(e, item.id)}
                title={t('dock.delete')}
              >
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 10 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <line x1="1" y1="1" x2="9" y2="9" />
                  <line x1="9" y1="1" x2="1" y2="9" />
                </svg>
              </button>
            </div>
          ))}

          {/* 添加按钮 */}
          <div className="dock-add-wrapper" ref={addWrapperRef}>
            <button
              className={`dock-item dock-add-btn${addOpen ? ' dock-add-active' : ''}`}
              title={t('dock.addSite')}
              onClick={() => {
                setEditingItem(null);
                setAddUrl('');
                setAddTitle('');
                setAddOpen((v) => !v);
              }}
            >
              <div className="dock-icon dock-icon-builtin">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <span className="dock-label">{t('dock.addSite')}</span>
            </button>

            {addOpen && (
              <div
                className="dock-add-panel"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="dock-add-panel-title">
                  {editingItem ? t('dock.editSite') : t('dock.addSite')}
                </p>
                <input
                  ref={addUrlInputRef}
                  type="text"
                  value={addUrl}
                  onChange={(e) => setAddUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDockItem()}
                  placeholder={t('dock.urlPlaceholder')}
                  spellCheck={false}
                />
                <input
                  type="text"
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDockItem()}
                  placeholder={t('dock.titlePlaceholder')}
                />
                <div className="dock-add-actions">
                  <button className="dock-add-confirm" onClick={handleAddDockItem}>
                    {editingItem ? t('dock.save') : t('dock.add')}
                  </button>
                  <button
                    className="dock-add-cancel"
                    onClick={() => {
                      setAddOpen(false);
                      setAddUrl('');
                      setAddTitle('');
                      setEditingItem(null);
                    }}
                  >
                    {t('dock.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {dockCtxMenu && (
        <ContextMenu
          x={dockCtxMenu.x}
          y={dockCtxMenu.y}
          items={[
            {
              key: 'open',
              label: t('contextMenu.open'),
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>,
              onClick: () => onNavigate(dockCtxMenu.item.url)
            },
            { key: 'sep', separator: true },
            {
              key: 'edit',
              label: t('contextMenu.edit'),
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
              onClick: () => {
                setEditingItem(dockCtxMenu.item);
                setAddUrl(dockCtxMenu.item.url);
                setAddTitle(dockCtxMenu.item.title);
                setAddOpen(true);
              }
            },
            {
              key: 'copyUrl',
              label: t('contextMenu.copyUrl'),
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
              onClick: () => {
                navigator.clipboard.writeText(dockCtxMenu.item.url);
                showOSD?.(t('contextMenu.copied'));
              }
            },
            { key: 'sep2', separator: true },
            {
              key: 'delete',
              label: t('contextMenu.delete'),
              danger: true,
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
              onClick: async () => {
                const items = await window.wingman.dock.removeItem(dockCtxMenu.item.id);
                setDockItems(items);
              }
            }
          ]}
          onClose={() => setDockCtxMenu(null)}
        />
      )}
      {bgCtxMenu && (
        <ContextMenu
          x={bgCtxMenu.x}
          y={bgCtxMenu.y}
          items={[
            {
              key: 'favorites',
              label: t('contextMenu.favorites'),
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
              onClick: onFavorites
            },
            {
              key: 'history',
              label: t('contextMenu.history'),
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              onClick: onHistory
            },
            { key: 'sep', separator: true },
            {
              key: 'settings',
              label: t('contextMenu.settings'),
              icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
              onClick: onSettings
            }
          ]}
          onClose={() => setBgCtxMenu(null)}
        />
      )}
    </div>
  );
}
