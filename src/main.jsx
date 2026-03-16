import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { supabase } from './supabaseClient'
import RecipeApp from '../gerechten app.jsx'
import AuthPage from './AuthPage.jsx'
import OnboardingPage from './OnboardingPage.jsx'

const AUTH_BOOT_TIMEOUT_MS = 5000
const PROFILE_BOOT_TIMEOUT_MS = 5000

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [onboardingDone, setOnboardingDone] = useState(null)
  const [bootstrapNotice, setBootstrapNotice] = useState("")

  useEffect(() => {
    let active = true
    const authTimeoutId = window.setTimeout(() => {
      if (!active) return
      setBootstrapNotice("Het laden van je sessie duurde te lang. Je kunt opnieuw inloggen.")
      setLoading(false)
    }, AUTH_BOOT_TIMEOUT_MS)

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        if (!active) return
        window.clearTimeout(authTimeoutId)
        setBootstrapNotice("")
        setSession(session)
        if (!session) setLoading(false)
      })
      .catch((error) => {
        if (!active) return
        window.clearTimeout(authTimeoutId)
        console.error("Session bootstrap error:", error)
        setBootstrapNotice("Je sessie kon niet worden geladen. Log opnieuw in om verder te gaan.")
        setLoading(false)
      })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      window.clearTimeout(authTimeoutId)
      setBootstrapNotice("")
      setSession(session)
      if (!session) {
        setOnboardingDone(null)
        setLoading(false)
      }
    })

    return () => {
      active = false
      window.clearTimeout(authTimeoutId)
      subscription.unsubscribe()
    }
  }, [])

  // Check onboarding status when session is available
  useEffect(() => {
    if (!session) return
    let active = true
    const profileTimeoutId = window.setTimeout(() => {
      if (!active) return
      setBootstrapNotice("Je profiel laden duurde te lang. De app opent zonder onboardingcontrole.")
      setOnboardingDone(true)
      setLoading(false)
    }, PROFILE_BOOT_TIMEOUT_MS);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", session.user.id)
          .single()
        if (!active) return
        window.clearTimeout(profileTimeoutId)
        setBootstrapNotice("")
        if (error || !data) {
          // Column or profile doesn't exist yet — skip onboarding
          setOnboardingDone(true)
        } else {
          setOnboardingDone(data.onboarding_completed === true)
        }
      } catch (error) {
        if (!active) return
        window.clearTimeout(profileTimeoutId)
        console.error("Profile bootstrap error:", error)
        setOnboardingDone(true)
      } finally {
        if (!active) return
        setLoading(false)
      }
    })()

    return () => {
      active = false
      window.clearTimeout(profileTimeoutId)
    }
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
          {bootstrapNotice && (
            <div style={{
              marginTop: 14,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              maxWidth: 320,
              lineHeight: 1.5,
              color: "#6B5D4F",
            }}>{bootstrapNotice}</div>
          )}
        </div>
      </div>
    )
  }

  if (!session) {
    return <AuthPage notice={bootstrapNotice} />
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
