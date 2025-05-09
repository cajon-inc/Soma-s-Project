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
  staffResults?: ReorderItem[]
  itemLabel?: string
}

function SortableItem({
  item,
  isDragging,
  highlight,
  isSelected,
  selectionMode,
  onToggleSelect,
  onLongPress,
  onOpenSingleSlider
}: {
  item: ReorderItem
  isDragging: boolean
  highlight: boolean
  isSelected: boolean
  selectionMode: boolean
  onToggleSelect: (id: number) => void
  onLongPress: (id: number) => void
  onOpenSingleSlider: (item: ReorderItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: item.id.toString(),
    disabled: selectionMode
  })

  const timerRef = useRef<number | null>(null)
  const LONG_PRESS_MS = 600

  const handlePointerDown = () => {
    if (selectionMode) return
    timerRef.current = window.setTimeout(
      () => onLongPress(item.id),
      LONG_PRESS_MS
    )
  }

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const handleClick = () => {
    if (selectionMode) {
      onToggleSelect(item.id)
    } else {
      onOpenSingleSlider(item)
    }
  }

  const adjustedTransform = transform ? { ...transform, x: 0 } : null
  const style = {
    transform: CSS.Transform.toString(adjustedTransform),
    transition,
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    zIndex: isDragging ? 10 : 1
  }

  return (
    <div
      id={`item-${item.id}`}
      ref={setNodeRef}
      style={style}
      className={`
        h-14 flex items-center justify-between w-full p-2 mb-2 border border-gray-200 rounded
        ${isSelected ? 'bg-gray-300 opacity-70' :
          highlight ? 'bg-amber-100' :
            isDragging ? 'bg-gray-100' : 'bg-white'}
        select-none
      `}
      onPointerDown={handlePointerDown}
      onPointerUp={clearTimer}
      onPointerLeave={clearTimer}
      onClick={handleClick}
    >
      <div className="flex items-center flex-1 min-w-0">
        <div className="cursor-pointer font-bold text-left w-14 mr-4 flex-shrink-0">
          {item.position}
        </div>
        <div className="truncate">{item.name}</div>
      </div>
      {!selectionMode && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-xl text-gray-500 p-2 flex-shrink-0"
        >
          ⋮⋮
        </div>
      )}
    </div>
  )
}

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
  const [selectedItem, setSelectedItem] = useState<ReorderItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<ReorderItem[][]>([])
  const [redoStack, setRedoStack] = useState<ReorderItem[][]>([])
  const scrollYRef = useRef(0)
  const searchAreaRef = useRef<HTMLDivElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const recordHistory = useCallback((prev: ReorderItem[]) => {
    setUndoStack((stack) => [...stack, prev])
    setRedoStack([])
  }, [])

  const clearSearchHighlight = useCallback(() => {
    setSearch('')
    setHighlightId(null)
    setMatchIds([])
    setMatchIdx(0)
  }, [])

  const handleLongPress = useCallback((id: number) => {
    setSelectionMode(true)
    setSelectedIds([id])
    setActiveId(null)
  }, [])

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedIds([])
  }, [])

  const getScrollbarWidth = () =>
    window.innerWidth - document.documentElement.clientWidth

  const lockScroll = () => {
    scrollYRef.current = window.scrollY
    const scrollbarWidth = getScrollbarWidth()
    Object.assign(document.body.style, {
      position: 'fixed',
      top: `-${scrollYRef.current}px`,
      width: '100vw',
      overflow: 'hidden',
      paddingRight: `${scrollbarWidth}px`
    })
  }

  const unlockScroll = () => {
    const y = scrollYRef.current
    Object.assign(document.body.style, {
      position: '',
      top: '',
      width: '',
      overflow: '',
      paddingRight: ''
    })
    window.scrollTo(0, y)
  }

  const handleDragStart = (e: DragStartEvent) => {
    setActiveId(e.active.id.toString())
    clearSearchHighlight()
    lockScroll()
  }

  const handleDragCancel = () => {
    setActiveId(null)
    unlockScroll()
  }

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    setActiveId(null)
    unlockScroll()
    if (over && active.id !== over.id) {
      const oldIdx = items.findIndex((i) => i.id.toString() === active.id)
      const newIdx = items.findIndex((i) => i.id.toString() === over.id)
      const newItems = arrayMove(items, oldIdx, newIdx).map((it, idx) => ({
        ...it,
        position: idx + 1
      }))
      recordHistory(items)
      setItems(newItems)
    }
  }

  const openSingleSlider = (item: ReorderItem) => {
    if (selectionMode) return
    setSelectedItem(item)
    setModalOpen(true)
  }

  const applySingleSlider = (position: number) => {
    if (!selectedItem) return
    const oldIdx = items.findIndex((it) => it.id === selectedItem.id)
    if (oldIdx < 0) return
    const newIdx = position - 1
    const newArr = [...items]
    const [rm] = newArr.splice(oldIdx, 1)
    newArr.splice(newIdx, 0, rm)
    recordHistory(items)
    setItems(newArr.map((it, idx) => ({ ...it, position: idx + 1 })))
    setModalOpen(false)
  }

  const openGroupSlider = () => {
    if (!selectedIds.length) return
    setGroupModalOpen(true)
  }

  const applyGroupSlider = (position: number) => {
    const selectedSet = new Set(selectedIds)
    const group = items.filter((it) => selectedSet.has(it.id))
    const remaining = items.filter((it) => !selectedSet.has(it.id))
    const insertIdx = Math.min(Math.max(position - 1, 0), remaining.length)
    const newItems = [
      ...remaining.slice(0, insertIdx),
      ...group,
      ...remaining.slice(insertIdx)
    ].map((it, idx) => ({ ...it, position: idx + 1 }))
    recordHistory(items)
    setItems(newItems)
    setGroupModalOpen(false)
    exitSelectionMode()
  }

  const deleteSelected = () => {
    if (!selectedIds.length) return
    recordHistory(items)
    setItems((prev) =>
      prev
        .filter((it) => !selectedIds.includes(it.id))
        .map((it, idx) => ({ ...it, position: idx + 1 }))
    )
    exitSelectionMode()
  }

  const handleUndo = () => {
    if (!undoStack.length || modalOpen || groupModalOpen) return
    setRedoStack((rs) => [...rs, items])
    const prev = undoStack[undoStack.length - 1]
    setUndoStack((us) => us.slice(0, us.length - 1))
    setItems(prev)
  }

  const handleRedo = () => {
    if (!redoStack.length || modalOpen || groupModalOpen) return
    setUndoStack((us) => [...us, items])
    const next = redoStack[redoStack.length - 1]
    setRedoStack((rs) => rs.slice(0, rs.length - 1))
    setItems(next)
  }

  const handleSave = () => {
    const positions = items.map(({ id, position }) => ({ id, position }))
    console.log('Saving positions:', positions)
    setUndoStack([])
    setRedoStack([])
    alert('並び替えを保存しました')
  }

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (
        searchAreaRef.current &&
        !searchAreaRef.current.contains(e.target as Node)
      ) {
        clearSearchHighlight()
      }
    }
    document.addEventListener('pointerdown', handler)
    return () => document.removeEventListener('pointerdown', handler)
  }, [clearSearchHighlight])

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
        document
          .getElementById(`item-${firstId}`)
          ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      )
    } else {
      setHighlightId(null)
    }
  }, [search, items])

  const showNextMatch = () => {
    if (!matchIds.length) return
    const nextIdx = (matchIdx + 1) % matchIds.length
    setMatchIdx(nextIdx)
    const id = matchIds[nextIdx]
    setHighlightId(id)
    requestAnimationFrame(() =>
      document
        .getElementById(`item-${id}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    )
  }

  const showPrevMatch = () => {
    if (!matchIds.length) return
    const prevIdx = (matchIdx - 1 + matchIds.length) % matchIds.length
    setMatchIdx(prevIdx)
    const id = matchIds[prevIdx]
    setHighlightId(id)
    requestAnimationFrame(() =>
      document
        .getElementById(`item-${id}`)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    )
  }

  useEffect(() => {
    setItems(Array.isArray(staffResults) ? staffResults : [])
  }, [staffResults])

  const hasSearchText = search.trim() !== ''
  const canUndo = undoStack.length > 0 && !modalOpen && !groupModalOpen
  const canRedo = redoStack.length > 0 && !modalOpen && !groupModalOpen

  return (
    <div className="p-4">
      <div className="sticky top-0 bg-white z-30 pb-3 mb-4">
        <div className="flex justify-between items-center gap-4">
          <h2 className="m-0 text-lg font-bold">{itemLabel}一覧</h2>
          <div ref={searchAreaRef} className="flex items-center gap-2">
            {hasSearchText && (
              <button
                onClick={showPrevMatch}
                disabled={!matchIds.length}
                className={`px-2 py-1 border border-gray-200 rounded ${
                  matchIds.length ? 'cursor-pointer' : 'cursor-default'
                } bg-white`}
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
              className="w-48 px-3 py-2 border border-gray-200 rounded-md text-sm"
            />
            {hasSearchText && (
              <>
                <button
                  onClick={showNextMatch}
                  disabled={!matchIds.length}
                  className={`px-2 py-1 border border-gray-200 rounded ${
                    matchIds.length ? 'cursor-pointer' : 'cursor-default'
                  } bg-white`}
                >
                  ▼
                </button>
                <span className="text-xs text-gray-500">
                  {matchIds.length ? `${matchIdx + 1}/${matchIds.length}` : '0/0'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={items.map((i) => i.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              isDragging={activeId === item.id.toString()}
              highlight={highlightId === item.id}
              isSelected={selectedIds.includes(item.id)}
              selectionMode={selectionMode}
              onToggleSelect={toggleSelect}
              onLongPress={handleLongPress}
              onOpenSingleSlider={openSingleSlider}
            />
          ))}
        </SortableContext>
      </DndContext>
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
      {groupModalOpen && (
        <SliderModal
          isOpen={groupModalOpen}
          onClose={() => setGroupModalOpen(false)}
          currentPosition={Math.min(
            ...selectedIds.map(
              (id) => items.find((it) => it.id === id)?.position || 1
            )
          )}
          maxPosition={items.length}
          onPositionChange={applyGroupSlider}
          itemName={`選択した${selectedIds.length}件`}
        />
      )}
      {!modalOpen && !groupModalOpen && !selectionMode && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex gap-2">
            {canUndo && (
              <button
                onClick={handleUndo}
                className="bg-gray-200 text-gray-700 border-none py-2 px-3 rounded-full cursor-pointer"
              >
                ◀︎ 戻る
              </button>
            )}
            <button
              onClick={handleSave}
              className="bg-amber-500 text-white border-none py-3 px-4 rounded-full shadow-md cursor-pointer"
            >
              並び替えを保存
            </button>
            {canRedo && (
              <button
                onClick={handleRedo}
                className="bg-gray-200 text-gray-700 border-none py-2 px-3 rounded-full cursor-pointer"
              >
                進む ▶︎
              </button>
            )}
          </div>
        </div>
      )}
      {selectionMode && !modalOpen && !groupModalOpen && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex gap-2">
            <button
              onClick={deleteSelected}
              className="bg-red-500 text-white border-none py-2 px-3 rounded-full cursor-pointer"
            >
              🗑️ 削除
            </button>
            <button
              onClick={openGroupSlider}
              disabled={!selectedIds.length}
              className={`${
                selectedIds.length ? 'bg-blue-500' : 'bg-blue-300'
              } text-white border-none py-2 px-3 rounded-full ${
                selectedIds.length ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              ↔︎ 並べ替え
            </button>
            <button
              onClick={exitSelectionMode}
              className="bg-gray-500 text-white border-none py-2 px-3 rounded-full cursor-pointer"
            >
              ✖️ キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
