import React, { useState, useEffect, useCallback } from 'react'
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
  salonId?: number
}

// SortableItemコンポーネント
function SortableStaffItem({ item, onOpenSlider }: { item: StaffItem; onOpenSlider: (item: StaffItem) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border rounded p-2 mb-2 flex items-center"
    >
      <div
        className="w-10 text-center cursor-pointer font-bold"
        onClick={() => onOpenSlider(item)}
      >
        {item.position}
      </div>
      <div className="flex-1 ml-2">{item.name}</div>
      <div
        className="cursor-grab ml-2 text-gray-500"
        {...attributes}
        {...listeners}
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

export default function StaffReorderPage({ staffResults = MOCK_STAFF, salonId = 1 }: StaffReorderPageProps) {
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
    console.log('handleDragEnd called with:', event)
    const { active, over } = event

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        console.log(`Moving item from index ${oldIndex} to index ${newIndex}`)
        
        const newItems = arrayMove(items, oldIndex, newIndex)
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          position: index + 1
        }))
        
        console.log('Updated items:', updatedItems)
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

    const updated = newItems.map((it, idx) => ({ ...it, position: idx + 1 }))
    setItems(updated)
    setModalOpen(false)
  }

  const handleSave = useCallback(() => {
    // In a real app, this would send data to the server
    // For this demo, we'll just simulate a successful save
    const positions = items.map((it) => ({ id: it.id, position: it.position }))
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
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">スタッフ一覧</h2>
        <button onClick={handleSave} className="border px-4 py-1 rounded">
          並び替えを保存
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={items.map(item => item.id)} 
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
    </div>
  )
} 