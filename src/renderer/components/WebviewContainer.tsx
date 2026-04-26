import { useRef, useEffect, useState } from 'react';
import type { TFunction } from '../hooks/useI18n';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';

// 当标签进入后台时注入的全面冻结脚本
const FREEZE_SCRIPT = `(function(){
  var s=window.__wingmanFreeze=window.__wingmanFreeze||{};
  if(s.frozen)return;
  s.frozen=true;
  s.paused=[];
  document.querySelectorAll('video,audio').forEach(function(el){
    if(!el.paused){try{el.pause();s.paused.push(el);}catch(e){}}
  });
  if(!s.origFetch&&window.fetch){
    s.origFetch=window.fetch;
    s.pendingFetch=[];
    window.fetch=function(){var a=arguments;return new Promise(function(r,j){s.pendingFetch.push([a,r,j]);});};
  }
  if(!s.origXhrSend&&window.XMLHttpRequest){
    var p=XMLHttpRequest.prototype;
    s.origXhrSend=p.send;
    s.pendingXhr=[];
    p.send=function(b){var self=this;s.pendingXhr.push(function(){s.origXhrSend.call(self,b);});};
  }
  try{document.dispatchEvent(new Event('freeze'));}catch(e){}
  try{
    Object.defineProperty(document,'visibilityState',{get:function(){return 'hidden';},configurable:true});
    Object.defineProperty(document,'hidden',{get:function(){return true;},configurable:true});
    document.dispatchEvent(new Event('visibilitychange'));
  }catch(e){}
})();`;

// 当标签恢复前台时注入的解冻脚本
const UNFREEZE_SCRIPT = `(function(){
  var s=window.__wingmanFreeze;
  if(!s||!s.frozen)return;
  s.frozen=false;
  (s.paused||[]).forEach(function(el){try{el.play().catch(function(){});}catch(e){}});
  s.paused=[];
  if(s.origFetch){
    var of=s.origFetch,pf=s.pendingFetch||[];
    window.fetch=of;s.origFetch=null;s.pendingFetch=[];
    pf.forEach(function(p){of.apply(window,p[0]).then(p[1]).catch(p[2]);});
  }
  if(s.origXhrSend){
    var os=s.origXhrSend,px=s.pendingXhr||[];
    XMLHttpRequest.prototype.send=os;s.origXhrSend=null;s.pendingXhr=[];
    px.forEach(function(fn){try{fn();}catch(e){}});
  }
  try{document.dispatchEvent(new Event('resume'));}catch(e){}
  try{
    Object.defineProperty(document,'visibilityState',{get:function(){return 'visible';},configurable:true});
    Object.defineProperty(document,'hidden',{get:function(){return false;},configurable:true});
    document.dispatchEvent(new Event('visibilitychange'));
  }catch(e){}
})();`;

interface WebviewContainerProps {
  url: string;
  visible: boolean;
  reloadTrigger?: number;
  onNavigate: (url: string, title?: string) => void;
  onTitleChange: (title: string) => void;
  onAddFav?: (url: string, title: string) => void;
  onOpenInBackground?: (url: string) => void;
  showOSD?: (msg: string) => void;
  t: TFunction;
}

export default function WebviewContainer({
  url,
  visible,
  reloadTrigger,
  onNavigate,
  onTitleChange,
  onAddFav,
  onOpenInBackground,
  showOSD,
  t
}: WebviewContainerProps) {
  const webviewRef = useRef<ElectronWebviewElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ctxParams, setCtxParams] = useState<(WingmanWebviewContextParams & { adjustedY: number }) | null>(null);
  // 只记录我们主动加载过的 URL，did-navigate（内部链接跳转）不更新它
  const loadedUrlRef = useRef('');
  // 当前 webview 实例的 webContentsId，dom-ready 后设置，用于过滤其他 webview 的右键菜单事件
  const myWebContentsIdRef = useRef<number | null>(null);
  // 用 ref 持有最新回调，使事件监听 effect 只注册一次（无需随 prop 变化重建监听器）
  const onNavigateRef = useRef(onNavigate);
  onNavigateRef.current = onNavigate;
  const onTitleChangeRef = useRef(onTitleChange);
  onTitleChangeRef.current = onTitleChange;
  // 追踪目标冻结状态：dom-ready 前暂存，ready 后立即应用
  const frozenIntentRef = useRef<boolean>(!visible);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv || !url || loadedUrlRef.current === url) return;
    loadedUrlRef.current = url;
    wv.src = url;
  }, [url]);

  useEffect(() => {
    if (!reloadTrigger) return;
    webviewRef.current?.reload();
  }, [reloadTrigger]);

  // 后台冻结：visible 切换时通知主进程节流 + 音频静音，并向页面注入全面冻结/解冻脚本
  useEffect(() => {
    frozenIntentRef.current = !visible;
    const id = myWebContentsIdRef.current;
    if (id === null) return;
    window.wingman.webview.setBackgroundThrottle(id, !visible);
    webviewRef.current?.executeJavaScript(visible ? UNFREEZE_SCRIPT : FREEZE_SCRIPT).catch(() => {});
  }, [visible]);

  // 订阅主进程发来的 webview 右键菜单事件，按 webContentsId 过滤确保只响应本实例
  useEffect(() => {
    const unsub = window.wingman.webview.onContextMenu((params) => {
      if (myWebContentsIdRef.current !== null && params.webContentsId !== myWebContentsIdRef.current) return;
      const toolbarEl = document.querySelector('.toolbar');
      const toolbarBottom = toolbarEl ? toolbarEl.getBoundingClientRect().bottom : 44;
      setCtxParams({ ...params, adjustedY: params.y + toolbarBottom });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const wv = webviewRef.current;
    if (!wv) return;

    const onStart = () => {
      setLoading(true);
      setError(null);
    };
    const onStop = () => setLoading(false);
    const handleNavigate = (event: Event & { url: string }) => {
      onNavigateRef.current(event.url, wv.getTitle() || event.url);
    };
    const onNavigateInPage = (event: Event & { url: string; isMainFrame: boolean }) => {
      if (event.isMainFrame) handleNavigate(event);
    };
    const onFail = (e: Event & { errorCode: number; errorDescription: string }) => {
      if (e.errorCode === -3) return;
      setLoading(false);
      setError(`${e.errorDescription} (${e.errorCode})`);
    };
    const onTitle = (e: Event & { title: string }) => onTitleChangeRef.current(e.title);

    // dom-ready 时记录本实例的 webContentsId，供右键菜单事件过滤使用
    const onDomReady = () => {
      myWebContentsIdRef.current = wv.getWebContentsId();
      // 后台打开的标签在 dom-ready 后立即全面冻结
      if (frozenIntentRef.current) {
        window.wingman.webview.setBackgroundThrottle(myWebContentsIdRef.current, true);
        wv.executeJavaScript(FREEZE_SCRIPT).catch(() => {});
      }
      wv.executeJavaScript(`
        if (!window.__wingmanLinkInterceptor) {
          window.__wingmanLinkInterceptor = true;
          document.addEventListener('click', function(e) {
            var a = e.target.closest ? e.target.closest('a') : null;
            if (a && a.target === '_blank' && a.href && /^https?:/.test(a.href)) {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = a.href;
            }
          }, true);
        }
      `).catch(() => {});
    };

    wv.addEventListener('did-start-loading', onStart);
    wv.addEventListener('did-stop-loading', onStop);
    wv.addEventListener('did-navigate', handleNavigate as EventListener);
    wv.addEventListener('did-navigate-in-page', onNavigateInPage as EventListener);
    wv.addEventListener('did-fail-load', onFail as EventListener);
    wv.addEventListener('page-title-updated', onTitle as EventListener);
    wv.addEventListener('dom-ready', onDomReady);

    return () => {
      wv.removeEventListener('did-start-loading', onStart);
      wv.removeEventListener('did-stop-loading', onStop);
      wv.removeEventListener('did-navigate', handleNavigate as EventListener);
      wv.removeEventListener('did-navigate-in-page', onNavigateInPage as EventListener);
      wv.removeEventListener('did-fail-load', onFail as EventListener);
      wv.removeEventListener('page-title-updated', onTitle as EventListener);
      wv.removeEventListener('dom-ready', onDomReady);
    };
  }, []);

  // 根据右键参数构建菜单项
  const buildMenuItems = (): ContextMenuItem[] => {
    if (!ctxParams) return [];
    const items: ContextMenuItem[] = [];

    if (ctxParams.isEditable) {
      items.push({
        key: 'cut',
        label: t('contextMenu.cut'),
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="20" r="2"/><circle cx="18" cy="20" r="2"/><path d="M5.5 6l7 14M18.5 6l-7 14"/><line x1="3" y1="6" x2="21" y2="6"/></svg>,
        disabled: !ctxParams.canCut,
        onClick: () => window.wingman.webview.execAction('cut', ctxParams.webContentsId)
      });
      items.push({
        key: 'copy',
        label: t('contextMenu.copy'),
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        disabled: !ctxParams.canCopy,
        onClick: () => window.wingman.webview.execAction('copy', ctxParams.webContentsId)
      });
      items.push({
        key: 'paste',
        label: t('contextMenu.paste'),
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>,
        disabled: !ctxParams.canPaste,
        onClick: () => window.wingman.webview.execAction('paste', ctxParams.webContentsId)
      });
      items.push({ key: 'sep-edit', separator: true });
    }

    if (ctxParams.selectionText && !ctxParams.isEditable) {
      items.push({
        key: 'copyText',
        label: t('contextMenu.copyText'),
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
        disabled: !ctxParams.canCopy,
        onClick: () => {
          navigator.clipboard.writeText(ctxParams.selectionText);
          showOSD?.(t('contextMenu.copied'));
        }
      });
      items.push({ key: 'sep-copy', separator: true });
    }

    if (ctxParams.linkURL) {
      items.push({
        key: 'copyLink',
        label: t('contextMenu.copyLinkUrl'),
        icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
        onClick: () => {
          navigator.clipboard.writeText(ctxParams.linkURL);
          showOSD?.(t('contextMenu.copied'));
        }
      });
      if (onOpenInBackground) {
        items.push({
          key: 'openInBackground',
          label: t('contextMenu.openInBackground'),
          icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="14" height="12" rx="2"/><path d="M8 8V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-3"/></svg>,
          onClick: () => onOpenInBackground(ctxParams.linkURL)
        });
      }
      items.push({ key: 'sep-link', separator: true });
    }

    items.push({
      key: 'reload',
      label: t('contextMenu.reload'),
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
      onClick: () => webviewRef.current?.reload()
    });
    items.push({
      key: 'copyUrl',
      label: t('contextMenu.copyPageUrl'),
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
      onClick: () => {
        navigator.clipboard.writeText(ctxParams.currentURL);
        showOSD?.(t('contextMenu.copied'));
      }
    });
    items.push({
      key: 'addFav',
      label: t('contextMenu.addFav'),
      icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
      onClick: () => onAddFav?.(ctxParams.currentURL, ctxParams.currentTitle)
    });

    return items;
  };

  return (
    <div className="webview-container" style={{ display: visible ? undefined : 'none' }}>
      <webview ref={webviewRef} style={{ width: '100%', height: '100%' }} allowpopups={true} />
      {loading && (
        <div className="loading-indicator">
          <div className="loading-spinner" />
          <span>{t('webview.loading')}</span>
        </div>
      )}
      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => {
                setError(null);
                webviewRef.current?.reload();
              }}
            >
              {t('webview.retry')}
            </button>
          </div>
        </div>
      )}
      {ctxParams && (
        <ContextMenu
          x={ctxParams.x}
          y={ctxParams.adjustedY}
          items={buildMenuItems()}
          onClose={() => setCtxParams(null)}
        />
      )}
    </div>
  );
}
