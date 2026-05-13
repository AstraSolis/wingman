import { useMemo, useCallback, memo } from 'react';
import WebviewContainer from './WebviewContainer';
import type { Tab } from '../hooks/useTabsPool';
import type { TFunction } from '../hooks/useI18n';

interface WebviewPoolContainerProps {
  tabs: Tab[];
  activeTabId: string | null;
  warmIds: string[];
  visible: boolean;
  mediaTrigger?: { action: string; seq: number } | null;
  findTrigger?: number;
  onNavigate: (id: string, url: string, title?: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onOpenInBackground: (url: string) => void;
  onAddFav: (url: string, title: string) => void;
  showOSD: (msg: string) => void;
  t: TFunction;
}

interface WebviewItemProps {
  tab: Tab;
  activeTabId: string | null;
  mediaTrigger: { action: string; seq: number } | null;
  findTrigger: number;
  onNavigate: (id: string, url: string, title?: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onOpenInBackground: (url: string) => void;
  onAddFav: (url: string, title: string) => void;
  showOSD: (msg: string) => void;
  t: TFunction;
}

/**
 * 单个 webview 条目的 memo 包装：为每个 tab 生成稳定的 onNavigate/onTitleChange 回调，
 * 避免父组件渲染时传入新的内联函数导致 WebviewContainer 无意义重渲。
 */
const WebviewItem = memo(function WebviewItem({
  tab,
  activeTabId,
  mediaTrigger,
  findTrigger,
  onNavigate,
  onTitleChange,
  onOpenInBackground,
  onAddFav,
  showOSD,
  t
}: WebviewItemProps) {
  const handleNavigate = useCallback(
    (url: string, title?: string) => onNavigate(tab.id, url, title),
    [tab.id, onNavigate]
  );
  const handleTitleChange = useCallback(
    (title: string) => onTitleChange(tab.id, title),
    [tab.id, onTitleChange]
  );

  return (
    <WebviewContainer
      url={tab.url}
      visible={tab.id === activeTabId}
      reloadTrigger={tab.reloadTrigger}
      mediaTrigger={tab.id === activeTabId ? mediaTrigger : null}
      findTrigger={tab.id === activeTabId ? findTrigger : 0}
      onNavigate={handleNavigate}
      onTitleChange={handleTitleChange}
      onOpenInBackground={onOpenInBackground}
      onAddFav={onAddFav}
      showOSD={showOSD}
      t={t}
    />
  );
});

/**
 * 分层 webview 池：active 标签可见，warm 标签保活但隐藏，cold 标签不挂载。
 * 切换标签时 warm 标签无需重新加载页面。
 */
export default function WebviewPoolContainer({
  tabs,
  activeTabId,
  warmIds,
  visible,
  mediaTrigger,
  findTrigger,
  onNavigate,
  onTitleChange,
  onOpenInBackground,
  onAddFav,
  showOSD,
  t
}: WebviewPoolContainerProps) {
  const mountedTabs = useMemo(() => {
    const mountedIds = new Set([...(activeTabId ? [activeTabId] : []), ...warmIds]);
    return tabs.filter(tab => mountedIds.has(tab.id));
  }, [tabs, activeTabId, warmIds]);

  return (
    <div className="webview-pool" style={{ display: visible ? undefined : 'none' }}>
      {mountedTabs.map(tab => (
        <WebviewItem
          key={tab.id}
          tab={tab}
          activeTabId={activeTabId}
          mediaTrigger={mediaTrigger ?? null}
          findTrigger={findTrigger ?? 0}
          onNavigate={onNavigate}
          onTitleChange={onTitleChange}
          onOpenInBackground={onOpenInBackground}
          onAddFav={onAddFav}
          showOSD={showOSD}
          t={t}
        />
      ))}
    </div>
  );
}
