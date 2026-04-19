import type { TFunction } from '../hooks/useI18n';

const closeIcon = (
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
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const trashIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--danger)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

interface ListModalProps {
  title: string;
  items: WingmanUserDataItem[];
  type: 'favorites' | 'history';
  onSelect: (item: WingmanUserDataItem) => void;
  onDelete?: (item: WingmanUserDataItem) => void;
  onClose: () => void;
  t: TFunction;
}

export default function ListModal({
  title,
  items,
  type,
  onSelect,
  onDelete,
  onClose,
  t
}: ListModalProps) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}>
            {closeIcon}
          </button>
        </div>
        <div className="modal-list">
          {!items?.length ? (
            <div className="empty-state">{t('home.emptyList')}</div>
          ) : (
            items.map((item) => (
              <div key={item.url} className="list-item" onClick={() => onSelect(item)}>
                <div className="list-item-content">
                  <div className="list-item-title">{item.title || t('home.unknownTitle')}</div>
                  <div className="list-item-url">{item.url}</div>
                </div>
                {type === 'favorites' && (
                  <div className="list-item-actions">
                    <button
                      className="icon-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(item);
                      }}
                    >
                      {trashIcon}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
