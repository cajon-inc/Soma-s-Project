import * as React from 'react'
import './App.css'
import StaffReorderPage from './pages/StaffReorderPage'

function App() {
  return (
    <div style={{ 
      maxWidth: '1280px', 
      margin: '0 auto', 
      padding: '2rem 1rem' 
    }}>
      <header style={{ 
        marginBottom: '2rem', 
        textAlign: 'center' 
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem' 
        }}>
          スタッフ管理システム
        </h1>
        <p style={{ color: '#6b7280' }}>
          スタッフの並び替えデモ
        </p>
      </header>
      
      <main>
        <StaffReorderPage />
      </main>
    </div>
  )
}

export default App