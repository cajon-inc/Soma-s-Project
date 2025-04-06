// components/SliderModal.tsx
import * as React from 'react'
import { useRef, useEffect, useState } from 'react'

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
  itemName
}: SliderModalProps) {
  const [sliderValue, setSliderValue] = useState<number>(currentPosition)
  const [feedback, setFeedback] = useState<string | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    setSliderValue(currentPosition)
    setFeedback(null)
  }, [currentPosition, isOpen])

  // モーダルが開いている時だけ表示
  if (!isOpen) return null

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderValue(Number(e.target.value))
  }

  const handleDecrement = () => {
    setSliderValue((prev) => Math.max(1, prev - 1))
  }

  const handleIncrement = () => {
    setSliderValue((prev) => Math.min(maxPosition, prev + 1))
  }

  const handleApply = () => {
    setFeedback('更新中...')
    setTimeout(() => {
      onPositionChange(sliderValue)
      onClose()
    }, 300)
  }

  const midValue = Math.ceil(maxPosition / 2)

  return (
    // モーダルオーバーレイ - 画面全体をカバー
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      style={{
        touchAction: 'none', // スクロール防止
        overflow: 'hidden',
        height: '100%',
        width: '100%'
      }}
    >
      {/* モーダル本体 - 中央に表示 */}
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-xs shadow-xl m-4 overflow-hidden"
        style={{
          maxHeight: '90vh',
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <style>
          {`
            /* スライダー見た目調整 */
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              height: 20px;
              width: 20px;
              background: #000;
              border-radius: 50%;
              margin-top: -9px;
              cursor: pointer;
            }
            input[type="range"]::-webkit-slider-runnable-track {
              height: 2px;
              cursor: pointer;
            }
            input[type="range"]::-moz-range-thumb {
              height: 20px;
              width: 20px;
              background: #000;
              border-radius: 50%;
              cursor: pointer;
            }
            input[type="range"]::-moz-range-track {
              height: 2px;
              background: transparent;
            }
          `}
        </style>

        {/* ヘッダー */}
        <div className="flex justify-between items-center p-3 border-b">
          <h3 className="text-base font-medium">数値を指定して並び替え</h3>
          <button
            onClick={onClose}
            className="text-2xl leading-none px-2"
          >
            &times;
          </button>
        </div>

        {/* スタッフ名 */}
        <div className="px-3 py-2 border-b">
          <div className="font-medium text-gray-800">
            {itemName}
          </div>
          <div className="text-sm text-gray-500">
            現在の順番: {currentPosition}
          </div>
        </div>

        {/* 大きめの数値 & 矢印ボタン */}
        <div className="py-4 flex flex-col items-center">
          <div className="flex items-center">
            <button
              onClick={handleDecrement}
              className="text-3xl font-bold mx-3 px-2 py-1"
            >
              &lt;
            </button>
            <div className="text-5xl font-bold w-24 text-center">
              {sliderValue}
            </div>
            <button
              onClick={handleIncrement}
              className="text-3xl font-bold mx-3 px-2 py-1"
            >
              &gt;
            </button>
          </div>
        </div>

        {/* 数値範囲表示 */}
        <div className="flex justify-between px-4 text-sm text-gray-600 mb-1">
          <span>1</span>
          <span>{midValue}</span>
          <span>{maxPosition}</span>
        </div>

        {/* スライダー */}
        <div className="px-4 mb-4">
          <input
            type="range"
            min={1}
            max={maxPosition}
            value={sliderValue}
            onChange={handleSliderChange}
            style={{
              background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${(sliderValue / maxPosition) * 100}%, #d1d5db ${(sliderValue / maxPosition) * 100}%, #d1d5db 100%)`,
              height: '2px',
              width: '100%',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* ボタン - 2つ横並び */}
        <div className="grid grid-cols-2 gap-2 border-t">
          <button
            onClick={onClose}
            className="py-3 text-gray-800 font-medium"
          >
            閉じる
          </button>
          <button
            onClick={handleApply}
            className="py-3 text-orange-500 font-medium"
          >
            移動する
          </button>
        </div>

        {/* フィードバック */}
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90">
            <div className="text-center text-gray-500">
              {feedback}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}