import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabaseClient'
import RecipeApp from '../gerechten app.jsx'
import AuthPage from './AuthPage.jsx'
import OnboardingPage from './OnboardingPage.jsx'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (!session) {
        setOnboardingDone(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Check onboarding status when session is available
  useEffect(() => {
    if (!session) return
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .single()
      setOnboardingDone(data?.onboarding_completed === true)
      setLoading(false)
    })()
  }, [session])

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #F5EDE3 0%, #EDE3D5 100%)",
        fontFamily: "'Playfair Display', serif", color: "#8B6F47", fontSize: 22
      }}>
        <div style={{ textAlign: "center" }}>
          <style>{`
            @keyframes spin-pan {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            fontSize: 48, marginBottom: 16,
            animation: "spin-pan 1.2s ease-in-out infinite",
            display: "inline-block"
          }}>🍳</div>
          <div>Laden...</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage />
  }

  if (onboardingDone === false) {
    return (
      <OnboardingPage
        user={session.user}
        onComplete={() => setOnboardingDone(true)}
      />
    )
  }

  return <RecipeApp session={session} />
}

createRoot(document.getElementById('root')).render(<App />)
