import React from 'react'
import './App.css'
import StaffReorderPage from '@/pages/StaffReorderPage'

function App() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">スタッフ管理システム</h1>
        <p className="text-gray-600">スタッフの並び替えデモ</p>
      </header>
      
      <main>
        <StaffReorderPage />
      </main>
    </div>
  )
}

export default App 