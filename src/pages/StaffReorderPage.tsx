import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
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

interface StaffItem {
  id: number
  name: string
  position: number
}

interface StaffReorderPageProps {
  staffResults?: StaffItem[]
}

function SortableStaffItem({
  item,
  onOpenSlider,
  isDragging
}: {
  item: StaffItem
  onOpenSlider: (item: StaffItem) => void
  isDragging: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id.toString() })

  const adjustedTransform = transform
    ? { ...transform, x: 0 }
    : null

  const baseStyle = {
    transform: CSS.Transform.toString(adjustedTransform),
    transition,
    height: '3.5rem',
    zIndex: isDragging ? 10 : 1,
    backgroundColor: isDragging ? '#f3f4f6' : 'white',
    WebkitTapHighlightColor: 'transparent'
  }

  const containerStyle = {
    ...baseStyle,
    display: 'flex',
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    border: '1px solid #e2e8f0',
    borderRadius: '0.25rem',
    touchAction: 'none'
  }

  return (
    <div ref={setNodeRef} style={containerStyle}>
      {/* 番号と名前 */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1
      }}>
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
        <div style={{ textAlign: 'left' }}>
          {item.name}
        </div>
      </div>

      {/* ハンドルアイコン*/}
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: 'grab',
          color: '#6b7280',
          padding: '0.5rem', 
          fontSize: '1.25rem', 
          touchAction: 'none' 
        }}
      >
        ⋮⋮
      </div>
    </div>
  )
}

const MOCK_STAFF: StaffItem[] = []
for (let i = 1; i <= 100; i++) {
  MOCK_STAFF.push({ id: i, name: `スタッフ${i}`, position: i })
}

export default function StaffReorderPage({
  staffResults = MOCK_STAFF
}: StaffReorderPageProps) {
  const [items, setItems] = useState<StaffItem[]>(staffResults)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StaffItem | null>(null)
  const [sliderValue, setSliderValue] = useState(0)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // activationConstraint: {
      //   delay: 100, 
      //   tolerance: 5, 
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id.toString())

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
  }

  const handleDragCancel = (event: DragCancelEvent) => {
    setActiveId(null)

    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''

    setActiveId(null)

    if (over && active.id !== over.id) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((i) => i.id.toString() === active.id)
        const newIndex = prevItems.findIndex((i) => i.id.toString() === over.id)
        const movedItems = arrayMove(prevItems, oldIndex, newIndex)
        const updatedItems = movedItems.map((it, idx) => ({
          ...it,
          position: idx + 1
        }))
        return updatedItems
      })
    }
  }

  const openSliderModal = (item: StaffItem) => {
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

    const updated = newItems.map((it, idx) => ({
      ...it,
      position: idx + 1
    }))
    setItems(updated)
    setModalOpen(false)
  }

  const handleSave = useCallback(() => {
    const positions = items.map((it) => ({
      id: it.id,
      position: it.position
    }))
    console.log('Saving positions:', positions)
    alert('並び替えを保存しました')
  }, [items])

  useEffect(() => {
    if (Array.isArray(staffResults)) {
      setItems(staffResults)
    } else {
      setItems([])
    }
  }, [staffResults])

  useEffect(() => {
    const preventDefaultTouchMove = (e: TouchEvent) => {
      // ドラッグ中のみスクロールを防止
      if (activeId) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventDefaultTouchMove)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [activeId])

  return (
    <div style={{ padding: '1rem' }}>
      {/* 一覧タイトル */}
      <div style={{ marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>スタッフ一覧</h2>
      </div>

      {/* 並べ替え用のDndContext */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext
          items={items.map((item) => item.id.toString())}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <SortableStaffItem
              key={item.id}
              item={item}
              onOpenSlider={openSliderModal}
              isDragging={activeId === item.id.toString()}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* スライダーモーダル */}
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

      {/* 「並び替えを保存」ボタン*/}
      {!modalOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
        >
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
