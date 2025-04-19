// src/pages/StaffReorderPage.tsx
import * as React from 'react'
import {
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react'
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
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import SliderModal from '../components/SliderModal'

interface ReorderItem {
  id: number
  name: string
  position: number
}

interface StaffReorderPageProps {
  /** 並べ替えるアイテムの初期値 */
  staffResults?: ReorderItem[]
  /** 検索対象のラベル（例: スタッフ, 商品, タスクなど） */
  itemLabel?: string
}

/* ───────────────── SortableItem ───────────────── */
function SortableItem({
  item,
  onOpenSlider,
  isDragging,
  highlight
}: {
  item: ReorderItem
  onOpenSlider: (item: ReorderItem) => void
  isDragging: boolean
  highlight: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id.toString() })

  const adjustedTransform = transform ? { ...transform, x: 0 } : null

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
    backgroundColor: highlight ? '#FEF3C7' : isDragging ? '#f3f4f6' : 'white',
    touchAction: 'none',
    zIndex: isDragging ? 10 : 1,
    WebkitTapHighlightColor: 'transparent'
  }

  return (
    <div id={`item-${item.id}`} ref={setNodeRef} style={containerStyle}>
      {/* 番号と名前 */}
      <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
        {/* 番号 */}
        <div
          onClick={() => onOpenSlider(item)}
          style={{
            cursor: 'pointer',
            fontWeight: 'bold',
            textAlign: 'left',
            width: '2.5rem',
            marginRight: '0.5rem'
          }}
        >
          {item.position}
        </div>
        {/* 名前 */}
        <div>{item.name}</div>
      </div>

      {/* ドラッグハンドル */}
      <div
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', fontSize: '1.25rem', color: '#6b7280', padding: '0.5rem' }}
      >
        ⋮⋮
      </div>
    </div>
  )
}

/* ───────────────── Mock & Component ───────────────── */
const MOCK_ITEMS: ReorderItem[] = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `スタッフ${i + 1}`,
  position: i + 1
}))

export default function StaffReorderPage({
  staffResults = MOCK_ITEMS,
  itemLabel = 'スタッフ'
}: StaffReorderPageProps) {
  const [items, setItems] = useState<ReorderItem[]>(staffResults)
  const [search, setSearch] = useState('')
  const [matchIds, setMatchIds] = useState<number[]>([])
  const [matchIdx, setMatchIdx] = useState(0)
  const [highlightId, setHighlightId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReorderItem | null>(null)
  const [sliderValue, setSliderValue] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)

  /* 画面固定用スクロール量 */
  const scrollYRef = useRef(0)

  /* 検索バーと矢印ボタンをまとめた領域の ref */
  const searchAreaRef = useRef<HTMLDivElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  /* ───────────── 共通クリア関数 ───────────── */
  const clearSearchHighlight = useCallback(() => {
    setSearch('')
    setHighlightId(null)
    setMatchIds([])
    setMatchIdx(0)
  }, [])

  /* ───────────── Drag Handlers ───────────── */
  const lockScroll = () => {
    scrollYRef.current = window.scrollY
    Object.assign(document.body.style, {
      position: 'fixed',
      top: `-${scrollYRef.current}px`,
      width: '100%',
      overflow: 'hidden'
    })
  }

  const unlockScroll = () => {
    const y = scrollYRef.current
    Object.assign(document.body.style, {
      position: '',
      top: '',
      width: '',
      overflow: ''
    })
    window.scrollTo(0, y)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString())
    clearSearchHighlight()          // ① ハンドルを掴んだら検索状態をリセット
    lockScroll()
  }

  const handleDragCancel = (_e: DragCancelEvent) => {
    setActiveId(null)
    unlockScroll()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    unlockScroll()
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((i) => i.id.toString() === active.id)
        const newIndex = prev.findIndex((i) => i.id.toString() === over.id)
        const moved = arrayMove(prev, oldIndex, newIndex)
        return moved.map((it, idx) => ({ ...it, position: idx + 1 }))
      })
    }
  }

  /* ───────────── Outside Click ───────────── */
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(e.target as Node)
      ) {
        clearSearchHighlight()       // ② 画面外クリックで検索状態リセット
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [clearSearchHighlight])

  /* ───────────── Modal ───────────── */
  const openSliderModal = (item: ReorderItem) => {
    setSelectedItem(item)
    setSliderValue(item.position)
    setModalOpen(true)
  }

  const applySliderValue = (position: number) => {
    if (!selectedItem) return
    const oldIndex = items.findIndex((it) => it.id === selectedItem.id)
    if (oldIndex < 0) return
    const newIndex = position - 1
    const newItems = [...items]
    const [removed] = newItems.splice(oldIndex, 1)
    newItems.splice(newIndex, 0, removed)
    setItems(newItems.map((it, idx) => ({ ...it, position: idx + 1 })))
    setModalOpen(false)
  }

  const handleSave = useCallback(() => {
    const positions = items.map(({ id, position }) => ({ id, position }))
    console.log('Saving positions:', positions)
    alert('並び替えを保存しました')
  }, [items])

  /* ───────────── Search & Highlight ───────────── */
  useEffect(() => {
    if (!search.trim()) {
      setHighlightId(null)
      setMatchIds([])
      setMatchIdx(0)
      return
    }
    const keyword = search.trim().toLowerCase()
    const matches = items.filter((i) => i.name.toLowerCase().includes(keyword))
    const ids = matches.map((i) => i.id)
    setMatchIds(ids)

    if (matches.length) {
      setMatchIdx(0)
      const firstId = matches[0].id
      setHighlightId(firstId)
      requestAnimationFrame(() =>
        document.getElementById(`item-${firstId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      )
    } else {
      setHighlightId(null)
    }
  }, [search, items])

  const showNextMatch = useCallback(() => {
    if (!matchIds.length) return
    const nextIdx = (matchIdx + 1) % matchIds.length
    setMatchIdx(nextIdx)
    const id = matchIds[nextIdx]
    setHighlightId(id)
    requestAnimationFrame(() =>
      document.getElementById(`item-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    )
  }, [matchIds, matchIdx])

  const showPrevMatch = useCallback(() => {
    if (!matchIds.length) return
    const prevIdx = (matchIdx - 1 + matchIds.length) % matchIds.length
    setMatchIdx(prevIdx)
    const id = matchIds[prevIdx]
    setHighlightId(id)
    requestAnimationFrame(() =>
      document.getElementById(`item-${id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    )
  }, [matchIds, matchIdx])

  /* 更新 */
  useEffect(() => {
    setItems(Array.isArray(staffResults) ? staffResults : [])
  }, [staffResults])

  const hasSearchText = search.trim() !== ''

  /* ───────────── JSX ───────────── */
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 'bold' }}>{itemLabel}一覧</h2>
          {/* 検索バー＋矢印ボタンをラップして ref 付与 */}
          <div ref={searchAreaRef} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
              onChange={(e) => setSearch(e.target.value)}
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
        <SortableContext items={items.map((i) => i.id.toString())} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onOpenSlider={openSliderModal}
              isDragging={activeId === item.id.toString()}
              highlight={highlightId === item.id}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* スライダー モーダル */}
      {selectedItem && (
        <SliderModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          currentPosition={sliderValue}
          maxPosition={items.length}
          onPositionChange={applySliderValue}
          itemName={selectedItem.name}
        />
      )}

      {/* 保存ボタン */}
      {!modalOpen && (
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 9999 }}>
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
        </div>
      )}
    </div>
  )
}
