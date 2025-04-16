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
  const [inputValue, setInputValue] = useState<string>(String(currentPosition))
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
    setInputValue(String(currentPosition))
    setFeedback(null)
  }, [currentPosition, isOpen])

  if (!isOpen) return null


  const clampValue = (raw: number | null) => {
    if (raw == null || isNaN(raw)) return 1
    return Math.min(Math.max(raw, 1), maxPosition)
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setSliderValue(val)
    setInputValue(String(val))
  }

  const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }


  const handleNumberInputBlur = () => {
    const num = parseInt(inputValue, 10)
    const clamped = clampValue(num)
    setSliderValue(clamped)
    setInputValue(String(clamped))
  }

  const handleDecrement = () => {
    setSliderValue((prev) => {
      const dec = Math.max(1, prev - 1)
      setInputValue(String(dec))
      return dec
    })
  }
  const handleIncrement = () => {
    setSliderValue((prev) => {
      const inc = Math.min(maxPosition, prev + 1)
      setInputValue(String(inc))
      return inc
    })
  }

  const handleApply = () => {
    setFeedback('更新中...')
    const num = parseInt(inputValue, 10)
    const clamped = clampValue(num)
    setSliderValue(clamped)
    setInputValue(String(clamped))

    setTimeout(() => {
      onPositionChange(clamped)
      onClose()
    }, 300)
  }

  const calcFillPercentage = () => {
    if (maxPosition <= 1) return 0
    return ((sliderValue - 1) / (maxPosition - 1)) * 100
  }
  const fillPercent = calcFillPercentage()
  const midValue = Math.ceil(maxPosition / 2)

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 9999,
        touchAction: 'none',
        overflow: 'hidden'
      }}
    >
      <div
        ref={modalRef}
        className="overflow-hidden relative"
        style={{
          maxHeight: '90vh',
          width: '85%',
          maxWidth: '300px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          backgroundColor: '#f8f9fa',
          borderRadius: '16px'
        }}
      >
        <style>
          {`
            /* スライダーの親指 */
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

            /* type="number" の上下矢印を非表示にする */
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield; /* Firefoxでの上下矢印非表示 */
            }
          `}
        </style>

        {/* ヘッダー */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8f9fa'
          }}
        >
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>数値を指定して並び替え</h3>
          <button
            onClick={onClose}
            style={{ fontSize: '1.5rem', lineHeight: '1', padding: '0 0.5rem' }}
          >
            &times;
          </button>
        </div>

        {/* スタッフ名 */}
        <div
          style={{
            padding: '0.75rem',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8f9fa'
          }}
        >
          <div style={{ fontWeight: 500, color: '#1F2937' }}>{itemName}</div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            現在の順番: {currentPosition}
          </div>
        </div>

        <div className="py-5 flex flex-col items-center">
          <div className="flex items-center">
            <button
              onClick={handleDecrement}
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 1rem',
                padding: '0.25rem 0.5rem',
                color: '#F59E0B'
              }}
            >
              &lt;
            </button>

            {/* 数字入力 */}
            <div
              style={{
                fontSize: '3.5rem',
                fontWeight: 'bold',
                width: '120px',
                textAlign: 'center',
                color: '#111827'
              }}
            >
              <input
                type="number"
                value={inputValue}
                onChange={handleNumberInputChange}
                onBlur={handleNumberInputBlur}
                min={1}
                max={maxPosition}
                style={{
                  width: '100%',
                  fontSize: '3.5rem',
                  textAlign: 'center',
                  color: '#111827',
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none'
                }}
              />
            </div>

            <button
              onClick={handleIncrement}
              style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 1rem',
                padding: '0.25rem 0.5rem',
                color: '#F59E0B'
              }}
            >
              &gt;
            </button>
          </div>
        </div>

        {/* 数値範囲表示 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 1.5rem',
            fontSize: '0.875rem',
            color: '#6B7280',
            marginBottom: '0.5rem'
          }}
        >
          <span style={{ fontWeight: 500 }}>1</span>
          <span style={{ fontWeight: 500 }}>{midValue}</span>
          <span style={{ fontWeight: 500 }}>{maxPosition}</span>
        </div>

        {/* スライダー */}
        <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
          <input
            type="range"
            min={1}
            max={maxPosition}
            value={sliderValue}
            onChange={handleSliderChange}
            style={{
              background: `linear-gradient(to right, #F59E0B 0%, #F59E0B ${fillPercent}%, #e2e8f0 ${fillPercent}%, #e2e8f0 100%)`,
              height: '4px',
              width: '100%',
              outline: 'none',
              WebkitAppearance: 'none'
            }}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
          />
        </div>

        {/* ボタン*/}
        <div style={{ padding: '0 1.5rem', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              borderTop: '1px solid #e2e8f0',
              height: '48px',
              width: '100%'
            }}
          >
            <button
              onClick={onClose}
              style={{
                height: '100%',
                width: '100%',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: '#6B7280',
                borderRight: '1px solid #e2e8f0',
                background: 'white',
                margin: 0,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px 0 0 8px'
              }}
            >
              閉じる
            </button>
            <button
              onClick={handleApply}
              style={{
                height: '100%',
                width: '100%',
                fontSize: '0.9375rem',
                fontWeight: 500,
                color: 'white',
                backgroundColor: '#F59E0B',
                margin: 0,
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0 8px 8px 0'
              }}
            >
              移動する
            </button>
          </div>
        </div>

        {/* フィードバック */}
        {feedback && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90">
            <div className="text-center text-gray-500">{feedback}</div>
          </div>
        )}
      </div>
    </div>
  )
}
