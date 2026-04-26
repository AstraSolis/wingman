import WebviewContainer from './WebviewContainer';
import type { Tab } from '../hooks/useTabsPool';
import type { TFunction } from '../hooks/useI18n';

interface WebviewPoolContainerProps {
  tabs: Tab[];
  activeTabId: string | null;
  warmIds: string[];
  visible: boolean;
  onNavigate: (id: string, url: string, title?: string) => void;
  onTitleChange: (id: string, title: string) => void;
  onOpenInBackground: (url: string) => void;
  onAddFav: (url: string, title: string) => void;
  showOSD: (msg: string) => void;
  t: TFunction;
}

/**
 * 分层 webview 池：active 标签可见，warm 标签保活但隐藏，cold 标签不挂载。
 * 切换标签时 warm 标签无需重新加载页面。
 */
export default function WebviewPoolContainer({
  tabs,
  activeTabId,
  warmIds,
  visible,
  onNavigate,
  onTitleChange,
  onOpenInBackground,
  onAddFav,
  showOSD,
  t
}: WebviewPoolContainerProps) {
  const mountedIds = new Set([...(activeTabId ? [activeTabId] : []), ...warmIds]);
  const mountedTabs = tabs.filter(tab => mountedIds.has(tab.id));

  return (
    <div className="webview-pool" style={{ display: visible ? undefined : 'none' }}>
      {mountedTabs.map(tab => (
        <WebviewContainer
          key={tab.id}
          url={tab.url}
          visible={tab.id === activeTabId}
          reloadTrigger={tab.reloadTrigger}
          onNavigate={(url, title) => onNavigate(tab.id, url, title)}
          onTitleChange={title => onTitleChange(tab.id, title)}
          onOpenInBackground={onOpenInBackground}
          onAddFav={onAddFav}
          showOSD={showOSD}
          t={t}
        />
      ))}
    </div>
  );
}
