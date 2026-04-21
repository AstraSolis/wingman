import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactElement } from 'react';

export interface ContextMenuItem {
  key: string;
  label?: string;
  icon?: ReactElement;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
  danger?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: -9999, y: -9999 });
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const finalX = x + el.offsetWidth > vw ? Math.max(0, vw - el.offsetWidth) : x;
    const finalY = y + el.offsetHeight > vh ? Math.max(0, vh - el.offsetHeight) : y;
    setPos({ x: finalX, y: finalY });
    setVisible(true);
  }, [x, y]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
    };
  }, [onClose]);

  return createPortal(
    <>
      {/* 全屏遮罩：拦截所有点击（含 webview 区域），确保菜单能关闭 */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 10000 }}
        onMouseDown={() => onClose()}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }}
      />
      <div
        className="ctx-menu"
        style={{ left: pos.x, top: pos.y, visibility: visible ? 'visible' : 'hidden', zIndex: 10001 }}
        ref={ref}
      >
        {items.map((item) =>
          item.separator ? (
            <div key={item.key} className="ctx-menu-sep" />
          ) : (
            <div
              key={item.key}
              className={[
                'ctx-menu-item',
                item.disabled ? 'disabled' : '',
                item.danger ? 'danger' : ''
              ].filter(Boolean).join(' ')}
              onClick={() => {
                if (!item.disabled) {
                  item.onClick?.();
                  onClose();
                }
              }}
            >
              {item.icon && <span className="ctx-menu-icon">{item.icon}</span>}
              <span>{item.label}</span>
            </div>
          )
        )}
      </div>
    </>,
    document.body
  );
}
