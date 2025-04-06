import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
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

// SortableItemコンポーネント - インラインスタイルを使用
function SortableStaffItem({
  item,
  onOpenSlider
}: {
  item: StaffItem
  onOpenSlider: (item: StaffItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id.toString() })

  // 横方向の移動を無効化（x = 0）
  const adjustedTransform = transform
    ? { ...transform, x: 0 }
    : null

  const baseStyle = {
    transform: CSS.Transform.toString(adjustedTransform),
    transition
  }

  // インラインスタイルで明示的に指定
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
    borderRadius: '0.25rem'
  }

  return (
    <div ref={setNodeRef} style={containerStyle}>
      {/* 左側グループ (番号と名前) */}
      <div style={{
        display: 'flex',
        flexDirection: 'row' as const,
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

      {/* ハンドルアイコン (右側) */}
      <div
        {...attributes}
        {...listeners}
        style={{ 
          cursor: 'grab', 
          color: '#6b7280'
        }}
      >
        ⋮⋮
      </div>
    </div>
  )
}

// Mock data for demonstration
const MOCK_STAFF: StaffItem[] = [
  { id: 1, name: '佐藤 健太', position: 1 },
  { id: 2, name: '鈴木 美咲', position: 2 },
  { id: 3, name: '田中 裕子', position: 3 },
  { id: 4, name: '伊藤 大輔', position: 4 },
  { id: 5, name: '渡辺 結衣', position: 5 }
]

export default function StaffReorderPage({
  staffResults = MOCK_STAFF
}: StaffReorderPageProps) {
  const [items, setItems] = useState<StaffItem[]>(staffResults)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StaffItem | null>(null)
  const [sliderValue, setSliderValue] = useState(0)

  // センサーの設定
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
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

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>スタッフ一覧</h2>
        <button 
          onClick={handleSave} 
          style={{ 
            border: '1px solid #e2e8f0', 
            padding: '0.25rem 1rem', 
            borderRadius: '0.25rem' 
          }}
        >
          並び替えを保存
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
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
            />
          ))}
        </SortableContext>
      </DndContext>

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
    </div>
  )
}