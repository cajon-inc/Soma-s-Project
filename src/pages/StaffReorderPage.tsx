// src/pages/StaffReorderPage.tsx
import * as React from 'react';
import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragCancelEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SliderModal from '../components/SliderModal';

function ImageModal({
  url,
  onClose
}: {
  url: string;
  onClose: () => void;
}) {
  if (!url) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        cursor: 'zoom-out'
      }}
    >
      <img
        src={url}
        alt=""
        style={{
          maxWidth: '90%',
          maxHeight: '90%',
          objectFit: 'contain',
          borderRadius: '0.5rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}
      />
    </div>
  );
}

interface ReorderItem {
  id: number;
  name: string;
  position: number;
  imageUrl?: string;
}

interface StaffReorderPageProps {
  staffResults?: ReorderItem[];
  itemLabel?: string;
}

function SortableItem({
  item,
  isDragging,
  highlight,
  isSelected,
  selectionMode,
  ignoreNextClickRef,
  onToggleSelect,
  onLongPress,
  onOpenSingleSlider,
  onOpenImageModal
}: {
  item: ReorderItem;
  isDragging: boolean;
  highlight: boolean;
  isSelected: boolean;
  selectionMode: boolean;
  ignoreNextClickRef: React.MutableRefObject<boolean>;
  onToggleSelect: (id: number) => void;
  onLongPress: (id: number) => void;
  onOpenSingleSlider: (item: ReorderItem) => void;
  onOpenImageModal: (url: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id.toString(), disabled: selectionMode });

  const timerRef = useRef<number | null>(null);
  const LONG_PRESS_MS = 600;

  const isHandle = (target: EventTarget | null) =>
    (target as HTMLElement)?.dataset?.handle === 'true';

  const handlePointerDown = (e: React.PointerEvent) => {
    if (selectionMode || isHandle(e.target)) return;
    timerRef.current = window.setTimeout(() => {
      ignoreNextClickRef.current = true;
      onLongPress(item.id);
    }, LONG_PRESS_MS);
  };
  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleOuterClick = () => {
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }
    if (selectionMode) {
      onToggleSelect(item.id);
    }
  };

  const handleNumberClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectionMode) return;
    onOpenSingleSlider(item);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.imageUrl) {
      onOpenImageModal(item.imageUrl);
    }
  };

  const adjustedTransform = transform ? { ...transform, x: 0 } : null;

  const containerStyle: React.CSSProperties = {
    transform: CSS.Transform.toString(adjustedTransform),
    transition,
    height: '3.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.25rem',
    backgroundColor: isSelected
      ? '#d1d5db'
      : highlight
        ? '#FEF3C7'
        : isDragging
          ? '#f3f4f6'
          : 'white',
    opacity: isSelected ? 0.7 : 1,
    touchAction: 'none',
    zIndex: isDragging ? 10 : 1,
    WebkitTapHighlightColor: 'transparent',
    userSelect: 'none'
  };

  return (
    <div
      id={`item-${item.id}`}
      ref={setNodeRef}
      style={containerStyle}
      onPointerDown={handlePointerDown}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onClick={handleOuterClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
        {/* 番号  */}
        <div
          onClick={handleNumberClick}
          style={{
            cursor: selectionMode ? 'pointer' : 'zoom-in',
            fontWeight: 'bold',
            textAlign: 'left',
            width: '2rem',
            marginRight: '0.5rem',
            flexShrink: 0
          }}
        >
          {item.position}
        </div>

        {/* 画像 */}
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt=""
            onClick={handleImageClick}
            style={{
              width: '2.5rem',
              height: '2.5rem',
              objectFit: 'cover',
              borderRadius: '0.375rem',
              marginRight: '0.5rem',
              flexShrink: 0,
              cursor: 'zoom-in'
            }}
          />
        )}

        {/* 名前 */}
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
      </div>

      {/* ドラッグハンドル */}
      {!selectionMode && (
        <div
          {...attributes}
          {...listeners}
          data-handle="true"
          style={{
            cursor: 'grab',
            fontSize: '1.25rem',
            color: '#6b7280',
            padding: '0.5rem'
          }}
        >
          ⋮⋮
        </div>
      )}
    </div>
  );
}

const MOCK_ITEMS: ReorderItem[] = [
  { id: 1, name: 'スタッフ1', position: 1, imageUrl: '/download.jpg' },
  { id: 2, name: 'スタッフ2', position: 2, imageUrl: '/download-1.jpg' },
  { id: 3, name: 'スタッフ3', position: 3, imageUrl: '/download-2.jpg' },
  ...Array.from({ length: 97 }, (_, i) => ({
    id: i + 4,
    name: `スタッフ${i + 4}`,
    position: i + 4
  }))
];

export default function StaffReorderPage({
  staffResults = MOCK_ITEMS,
  itemLabel = 'スタッフ'
}: StaffReorderPageProps) {

  const [items, setItems] = useState<ReorderItem[]>(staffResults);
  const [search, setSearch] = useState('');
  const [matchIds, setMatchIds] = useState<number[]>([]);
  const [matchIdx, setMatchIdx] = useState(0);
  const [highlightId, setHighlightId] = useState<number | null>(null);

  const [selectedItem, setSelectedItem] = useState<ReorderItem | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [imageUrlOpen, setImageUrlOpen] = useState<string | null>(null);


  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [groupModalOpen, setGroupModalOpen] = useState(false);


  const [activeId, setActiveId] = useState<string | null>(null);

  const [undoStack, setUndoStack] = useState<ReorderItem[][]>([]);
  const [redoStack, setRedoStack] = useState<ReorderItem[][]>([]);


  const searchAreaRef = useRef<HTMLDivElement | null>(null);


  const ignoreNextClickRef = useRef(false);


  const scrollYRef = useRef(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const lockScroll = () => {
    scrollYRef.current = window.scrollY;
    Object.assign(document.body.style, {
      position: 'fixed',
      top: `-${scrollYRef.current}px`,
      width: '100%',
      overflow: 'hidden'
    });
  };

  const unlockScroll = () => {
    const y = scrollYRef.current;
    Object.assign(document.body.style, {
      position: '',
      top: '',
      width: '',
      overflow: ''
    });
    window.scrollTo(0, y);
  };

  const recordHistory = useCallback((prev: ReorderItem[]) => {
    setUndoStack(stack => [...stack, prev]);
    setRedoStack([]);
  }, []);

  const clearSearchHighlight = useCallback(() => {
    setSearch('');
    setHighlightId(null);
    setMatchIds([]);
    setMatchIdx(0);
  }, []);

  const handleLongPress = useCallback((id: number) => {
    setSelectionMode(true);
    setSelectedIds([id]);
    setActiveId(null);
  }, []);

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id.toString());
    clearSearchHighlight();
    lockScroll();
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    unlockScroll();
    if (over && active.id !== over.id) {
      const oldIdx = items.findIndex(i => i.id.toString() === active.id);
      const newIdx = items.findIndex(i => i.id.toString() === over.id);
      const newItems = arrayMove(items, oldIdx, newIdx).map((it, idx) => ({
        ...it,
        position: idx + 1
      }));
      recordHistory(items);
      setItems(newItems);
    }
  };

  const handleDragCancel = (_e: DragCancelEvent) => {
    setActiveId(null);
    unlockScroll();
  };

  const openSingleSlider = (item: ReorderItem) => {
    if (selectionMode) return;
    setSelectedItem(item);
    setModalOpen(true);
  };

  const openImageModal = (url: string) => {
    setImageUrlOpen(url);
  };

  const scrollToItem = (id: number) => {
    requestAnimationFrame(() =>
      document
        .getElementById(`item-${id}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    );
  };

  const applySingleSlider = (position: number) => {
    if (!selectedItem) return;
    const oldIdx = items.findIndex(it => it.id === selectedItem.id);
    if (oldIdx < 0) return;
    const newIdx = position - 1;
    const newArr = [...items];
    const [rm] = newArr.splice(oldIdx, 1);
    newArr.splice(newIdx, 0, rm);
    recordHistory(items);
    setItems(newArr.map((it, idx) => ({ ...it, position: idx + 1 })));
    setModalOpen(false);
    setTimeout(() => scrollToItem(selectedItem.id), 0);
  };

  const openGroupSlider = () => {
    if (!selectedIds.length) return;
    setGroupModalOpen(true);
  };

  const applyGroupSlider = (position: number) => {
    const selectedSet = new Set(selectedIds);
    const group = items.filter(it => selectedSet.has(it.id));
    const remaining = items.filter(it => !selectedSet.has(it.id));
    const insertIdx = Math.min(Math.max(position - 1, 0), remaining.length);
    const newItems = [
      ...remaining.slice(0, insertIdx),
      ...group,
      ...remaining.slice(insertIdx)
    ].map((it, idx) => ({ ...it, position: idx + 1 }));
    recordHistory(items);
    setItems(newItems);
    setGroupModalOpen(false);
    exitSelectionMode();
    setTimeout(() => scrollToItem(group[0].id), 0);
  };


  const deleteSelected = () => {
    if (!selectedIds.length) return;
    recordHistory(items);
    setItems(prev =>
      prev.filter(it => !selectedIds.includes(it.id)).map((it, idx) => ({
        ...it,
        position: idx + 1
      }))
    );
    exitSelectionMode();
  };


  const handleUndo = () => {
    if (!undoStack.length || modalOpen || groupModalOpen) return;
    setRedoStack(rs => [...rs, items]);
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(us => us.slice(0, us.length - 1));
    setItems(prev);
  };

  const handleRedo = () => {
    if (!redoStack.length || modalOpen || groupModalOpen) return;
    setUndoStack(us => [...us, items]);
    const next = redoStack[redoStack.length - 1];
    setRedoStack(rs => rs.slice(0, rs.length - 1));
    setItems(next);
  };

  const handleSave = () => {
    console.table(items.map(({ id, position }) => ({ id, position })));
    setUndoStack([]);
    setRedoStack([]);
    // eslint-disable-next-line no-alert
    alert('並び替えを保存しました');
  };

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(e.target as Node)
      ) {
        clearSearchHighlight();
      }
    };
    document.addEventListener('pointerdown', handler);
    return () => document.removeEventListener('pointerdown', handler);
  }, [clearSearchHighlight]);


  useEffect(() => {
    if (!search.trim()) {
      setHighlightId(null);
      setMatchIds([]);
      setMatchIdx(0);
      return;
    }
    const keyword = search.trim().toLowerCase();
    const matches = items.filter(i => i.name.toLowerCase().includes(keyword));
    const ids = matches.map(i => i.id);
    setMatchIds(ids);

    if (matches.length) {
      setMatchIdx(0);
      const firstId = matches[0].id;
      setHighlightId(firstId);
      scrollToItem(firstId);
    } else {
      setHighlightId(null);
    }
  }, [search, items]);

  const showNextMatch = () => {
    if (!matchIds.length) return;
    const nextIdx = (matchIdx + 1) % matchIds.length;
    setMatchIdx(nextIdx);
    const id = matchIds[nextIdx];
    setHighlightId(id);
    scrollToItem(id);
  };

  const showPrevMatch = () => {
    if (!matchIds.length) return;
    const prevIdx = (matchIdx - 1 + matchIds.length) % matchIds.length;
    setMatchIdx(prevIdx);
    const id = matchIds[prevIdx];
    setHighlightId(id);
    scrollToItem(id);
  };

  useEffect(() => {
    setItems(Array.isArray(staffResults) ? staffResults : []);
  }, [staffResults]);

  const hasSearchText = search.trim() !== '';
  const canUndo = undoStack.length > 0 && !modalOpen && !groupModalOpen;
  const canRedo = redoStack.length > 0 && !modalOpen && !groupModalOpen;

  return (
    <div style={{ padding: '1rem' }}>
      {/* ヘッダー */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#ffffff',
          zIndex: 30,
          paddingBottom: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>
            {itemLabel}一覧
          </h2>

          {/* 検索 */}
          <div
            ref={searchAreaRef}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            {hasSearchText && (
              <button
                onClick={showPrevMatch}
                disabled={!matchIds.length}
                style={{
                  padding: '0.25rem 0.5rem',
                  cursor: matchIds.length ? 'pointer' : 'default',
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.25rem',
                  backgroundColor: 'white'
                }}
              >
                ▲
              </button>
            )}
            <input
              type="text"
              placeholder={`${itemLabel}検索...`}
              aria-label={`${itemLabel}検索`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '9rem',
                padding: '0.5rem 0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '0.375rem',
                fontSize: '0.875rem'
              }}
            />
            {hasSearchText && (
              <>
                <button
                  onClick={showNextMatch}
                  disabled={!matchIds.length}
                  style={{
                    padding: '0.25rem 0.5rem',
                    cursor: matchIds.length ? 'pointer' : 'default',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.25rem',
                    backgroundColor: 'white'
                  }}
                >
                  ▼
                </button>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                  {matchIds.length ? `${matchIdx + 1}/${matchIds.length}` : '0/0'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 並べ替えリスト */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={items.map(i => i.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {items.map(item => (
            <SortableItem
              key={item.id}
              item={item}
              isDragging={activeId === item.id.toString()}
              highlight={highlightId === item.id}
              isSelected={selectedIds.includes(item.id)}
              selectionMode={selectionMode}
              ignoreNextClickRef={ignoreNextClickRef}
              onToggleSelect={toggleSelect}
              onLongPress={handleLongPress}
              onOpenSingleSlider={openSingleSlider}
              onOpenImageModal={openImageModal}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* 単一スライダー */}
      {selectedItem && (
        <SliderModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentPosition={selectedItem.position}
          maxPosition={items.length}
          onPositionChange={applySingleSlider}
          itemName={selectedItem.name}
        />
      )}

      {/* 画像モーダル */}
      <ImageModal url={imageUrlOpen ?? ''} onClose={() => setImageUrlOpen(null)} />

      {/* グループスライダー */}
      {groupModalOpen && (
        <SliderModal
          isOpen={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          currentPosition={Math.min(
            ...selectedIds.map(
              id => items.find(it => it.id === id)?.position || 1
            )
          )}
          maxPosition={items.length}
          onPositionChange={applyGroupSlider}
          itemName={`選択した${selectedIds.length}件`}
        />
      )}

      {/* フッターボタン */}
      {!modalOpen && !groupModalOpen && !selectionMode && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {canUndo && (
              <button
                onClick={handleUndo}
                style={{
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                ◀︎ 戻る
              </button>
            )}
            <button
              onClick={handleSave}
              style={{
                backgroundColor: '#F59E0B',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1rem',
                borderRadius: '9999px',
                boxShadow: '0 4px 9px rgba(0,0,0,0.1)',
                cursor: 'pointer'
              }}
            >
              並び替えを保存
            </button>
            {canRedo && (
              <button
                onClick={handleRedo}
                style={{
                  backgroundColor: '#E5E7EB',
                  color: '#374151',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '9999px',
                  cursor: 'pointer'
                }}
              >
                進む ▶︎
              </button>
            )}
          </div>
        </div>
      )}

      {/* 複数選択操作バー */}
      {selectionMode && !modalOpen && !groupModalOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={deleteSelected}
              style={{
                backgroundColor: '#EF4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                cursor: 'pointer'
              }}
            >
              🗑️ 削除
            </button>
            <button
              onClick={openGroupSlider}
              disabled={!selectedIds.length}
              style={{
                backgroundColor: selectedIds.length ? '#3B82F6' : '#93C5FD',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                cursor: selectedIds.length ? 'pointer' : 'default'
              }}
            >
              ↔︎ 並べ替え
            </button>
            <button
              onClick={exitSelectionMode}
              style={{
                backgroundColor: '#6B7280',
                color: 'white',
                border: 'none',
                padding: '0.5rem 0.75rem',
                borderRadius: '9999px',
                cursor: 'pointer'
              }}
            >
              ✖️ キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
