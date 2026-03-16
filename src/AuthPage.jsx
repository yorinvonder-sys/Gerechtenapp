import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function AuthPage({ notice = "" }) {
  const [mode, setMode] = useState("login"); // login | register | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        setMessage("Check je e-mail om je account te bevestigen!");
        setMode("login");
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage("Wachtwoord reset link verstuurd naar je e-mail!");
        setMode("login");
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "1.5px solid #E2DAD0", background: "#FAF7F2",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3D2E1F",
    outline: "none", transition: "border-color 0.2s",
  };

  const buttonStyle = {
    width: "100%", padding: "16px", borderRadius: 14, border: "none",
    background: "linear-gradient(135deg, #D4A574 0%, #C09060 50%, #A67B50 100%)",
    color: "#fff", fontFamily: "'DM Sans', sans-serif",
    fontSize: 15, fontWeight: 700, cursor: loading ? "wait" : "pointer",
    transition: "all 0.3s",
    boxShadow: "0 6px 24px rgba(212,165,116,0.35)",
    letterSpacing: 0.3, opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #F5EDE3 0%, #EDE3D5 50%, #E8DFD1 100%)",
      fontFamily: "'DM Sans', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        input:focus { border-color: #8B6F47 !important; }
      `}</style>

      <div style={{
        width: "100%", maxWidth: 420,
        animation: "fadeIn 0.5s ease",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", margin: "0 auto 16px",
            background: "linear-gradient(135deg, #2C1810, #4A3228)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, boxShadow: "0 8px 32px rgba(44,24,16,0.25)",
          }}>🍳</div>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#3D2E1F",
            margin: 0, letterSpacing: -0.5,
          }}>Onze Recepten</h1>
          <p style={{
            fontSize: 13, color: "#8C7E6F", margin: "6px 0 0",
          }}>Je persoonlijke culinaire verzameling</p>
        </div>

        {/* Form card */}
        <div style={{
          background: "#FFFCF7", borderRadius: 24, padding: "32px 28px",
          boxShadow: "0 4px 28px rgba(139,111,71,0.10)",
          border: "1px solid #EDE8E0",
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#3D2E1F",
            margin: "0 0 24px", textAlign: "center",
          }}>
            {mode === "login" ? "Inloggen" : mode === "register" ? "Account aanmaken" : "Wachtwoord vergeten"}
          </h2>

          {notice && (
            <p style={{
              background: "#F5EDE3",
              border: "1px solid #E2DAD0",
              borderRadius: 12,
              color: "#6B5D4F",
              fontSize: 13,
              lineHeight: 1.5,
              margin: "0 0 18px",
              padding: "12px 14px",
            }}>
              {notice}
            </p>
          )}

          {/* Google OAuth button */}
          {mode !== "forgot" && (
            <>
              <button onClick={handleGoogleLogin} disabled={loading}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: 12,
                  border: "1.5px solid #E2DAD0", background: "#fff",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                  color: "#3D2E1F", cursor: "pointer", transition: "all 0.2s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 2.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Inloggen met Google
              </button>

              <div style={{
                display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
              }}>
                <div style={{ flex: 1, height: 1, background: "#E2DAD0" }} />
                <span style={{ fontSize: 12, color: "#A89B8A", fontWeight: 500 }}>of</span>
                <div style={{ flex: 1, height: 1, background: "#E2DAD0" }} />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Naam
                </label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Je naam" required style={inputStyle} />
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 6 }}>
                E-mail
              </label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl" required style={inputStyle} />
            </div>

            {mode !== "forgot" && (
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Wachtwoord
                </label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Minimaal 6 tekens" : "Je wachtwoord"}
                  required minLength={mode === "register" ? 6 : undefined} style={inputStyle} />
              </div>
            )}

            {error && (
              <p style={{ color: "#C85A3D", fontSize: 13, margin: "0 0 14px", fontWeight: 500 }}>
                {error}
              </p>
            )}

            {message && (
              <p style={{ color: "#6B8F5E", fontSize: 13, margin: "0 0 14px", fontWeight: 500 }}>
                {message}
              </p>
            )}

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Even wachten..." :
                mode === "login" ? "Inloggen" :
                mode === "register" ? "Account aanmaken" : "Reset link versturen"}
            </button>
          </form>

          {/* Mode switching */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("forgot"); setError(""); setMessage(""); }}
                  style={{
                    background: "none", border: "none", color: "#8B6F47",
                    fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 500, marginBottom: 8, display: "block", width: "100%",
                  }}>Wachtwoord vergeten?</button>
                <p style={{ fontSize: 13, color: "#8C7E6F", margin: 0 }}>
                  Nog geen account?{" "}
                  <button onClick={() => { setMode("register"); setError(""); setMessage(""); }}
                    style={{
                      background: "none", border: "none", color: "#8B6F47",
                      fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                    }}>Maak er een aan</button>
                </p>
              </>
            )}
            {mode === "register" && (
              <p style={{ fontSize: 13, color: "#8C7E6F", margin: 0 }}>
                Al een account?{" "}
                <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  style={{
                    background: "none", border: "none", color: "#8B6F47",
                    fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}>Inloggen</button>
              </p>
            )}
            {mode === "forgot" && (
              <p style={{ fontSize: 13, color: "#8C7E6F", margin: 0 }}>
                <button onClick={() => { setMode("login"); setError(""); setMessage(""); }}
                  style={{
                    background: "none", border: "none", color: "#8B6F47",
                    fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                  }}>Terug naar inloggen</button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
