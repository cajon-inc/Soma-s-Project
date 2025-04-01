import React, { useRef, useEffect, useState } from 'react'

interface SliderModalProps {
  isOpen: boolean
  onClose: () => void
  currentPosition: number
  maxPosition: number
  onPositionChange: (pos: number) => void
  itemName: string
}

export default function SliderModal({
  isOpen,
  onClose,
  currentPosition,
  maxPosition,
  onPositionChange,
  itemName,
}: SliderModalProps): JSX.Element | null {
  const [value, setValue] = useState<number>(currentPosition)
  const modalRef = useRef<HTMLDivElement>(null)

  // モーダル外をクリックしたら閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // currentPosition が更新されたら反映
  useEffect(() => {
    setValue(currentPosition)
  }, [currentPosition])

  if (!isOpen) return null

  const decrement = () => {
    if (value > 1) setValue(value - 1)
  }
  
  const increment = () => {
    if (value < maxPosition) setValue(value + 1)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(Number(e.target.value))
  }

  const handleApply = () => {
    onPositionChange(value)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className="bg-white rounded-md p-4 w-full max-w-sm shadow-md"
        ref={modalRef}
      >
        <h3 className="text-lg font-bold mb-4">
          「{itemName}」の位置を変更 ({value}/{maxPosition})
        </h3>
        <div className="flex gap-2 items-center mb-4">
          <button 
            className="border px-2 py-1 rounded" 
            onClick={decrement}
          >
            ←
          </button>
          <input
            type="range"
            min={1}
            max={maxPosition}
            value={value}
            onChange={handleSliderChange}
            className="flex-1"
          />
          <button 
            className="border px-2 py-1 rounded" 
            onClick={increment}
          >
            →
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <button 
            className="border px-3 py-1 rounded" 
            onClick={onClose}
          >
            キャンセル
          </button>
          <button 
            className="bg-blue-600 text-white px-3 py-1 rounded" 
            onClick={handleApply}
          >
            適用
          </button>
        </div>
      </div>
    </div>
  )
} 