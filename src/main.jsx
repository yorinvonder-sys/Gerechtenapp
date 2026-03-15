import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabaseClient'
import RecipeApp from '../gerechten app.jsx'
import AuthPage from './AuthPage.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #F5EDE3 0%, #EDE3D5 100%)",
        fontFamily: "'Playfair Display', serif", color: "#8B6F47", fontSize: 22
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🍳</div>
          Laden...
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  return <RecipeApp session={session} />
}

createRoot(document.getElementById('root')).render(<App />)
