import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const CUISINES = ["Italiaans", "Aziatisch", "Mexicaans", "Frans", "Grieks", "Indiaas", "Japans", "Thais", "Hollands", "Amerikaans", "Midden-Oosters", "Afrikaans"];
const DIETS = ["Vegetarisch", "Veganistisch", "Glutenvrij", "Lactosevrij", "Koolhydraatarm", "Eiwitrijk"];

const SUPERMARKETS = [
  { id: "albert_heijn", name: "Albert Heijn", color: "#00A0E2", logo: "/images/supermarkets/albert_heijn.webp" },
  { id: "jumbo", name: "Jumbo", color: "#FFD700", logo: "/images/supermarkets/jumbo.webp" },
  { id: "lidl", name: "Lidl", color: "#0050AA", logo: "/images/supermarkets/lidl.webp" },
  { id: "aldi", name: "Aldi", color: "#E30613", logo: "/images/supermarkets/aldi.webp" },
  { id: "plus", name: "PLUS", color: "#E87C1E", logo: "/images/supermarkets/plus.webp" },
  { id: "dirk", name: "Dirk", color: "#D4001A", logo: "/images/supermarkets/dirk.webp" },
];

export default function ProfilePage({ user, profile, onProfileUpdate }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [favCuisine, setFavCuisine] = useState(profile?.favorite_cuisine || []);
  const [dietPrefs, setDietPrefs] = useState(profile?.dietary_preferences || []);
  const [preferredSupermarket, setPreferredSupermarket] = useState(profile?.preferred_supermarket || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ recipes: 0, favorites: 0, pantry: 0, shared: 0 });

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setFavCuisine(profile?.favorite_cuisine || []);
    setDietPrefs(profile?.dietary_preferences || []);
    setPreferredSupermarket(profile?.preferred_supermarket || "");
  }, [profile]);

  const loadStats = async () => {
    const [recipesRes, pantryRes, sharedRes] = await Promise.all([
      supabase.from("recipes").select("id, favorite", { count: "exact" }).eq("user_id", user.id),
      supabase.from("pantry_items").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("shared_recipes").select("id", { count: "exact" }).eq("shared_by", user.id),
    ]);
    setStats({
      recipes: recipesRes.count || 0,
      favorites: recipesRes.data?.filter(r => r.favorite).length || 0,
      pantry: pantryRes.count || 0,
      shared: sharedRes.count || 0,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
      favorite_cuisine: favCuisine,
      dietary_preferences: dietPrefs,
      preferred_supermarket: preferredSupermarket,
    });
    if (!error) {
      setSaved(true);
      onProfileUpdate({ display_name: displayName, favorite_cuisine: favCuisine, dietary_preferences: dietPrefs, preferred_supermarket: preferredSupermarket });
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const toggleDiet = (diet) => {
    setDietPrefs(prev => prev.includes(diet) ? prev.filter(d => d !== diet) : [...prev, diet]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const inputStyle = {
    width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "1.5px solid #E2DAD0", background: "#FAF7F2",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3D2E1F",
    outline: "none", transition: "border-color 0.2s",
  };

  return (
    <div>
      {/* Profile header */}
      <div style={{
        background: "#FFFCF7", borderRadius: 24, padding: "28px 24px",
        boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 20,
        border: "1px solid #EDE8E0", textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", margin: "0 auto 14px",
          background: "linear-gradient(135deg, #D4A574, #C09060)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, color: "#fff", fontWeight: 700,
          boxShadow: "0 4px 16px rgba(212,165,116,0.3)",
        }}>
          {displayName ? displayName.charAt(0).toUpperCase() : "?"}
        </div>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#3D2E1F",
          margin: "0 0 4px",
        }}>{displayName || "Naamloos"}</h2>
        <p style={{ fontSize: 12, color: "#A89B8A", margin: 0 }}>{user.email}</p>

        {/* Stats */}
        <div style={{
          display: "flex", justifyContent: "center", gap: 24, marginTop: 20,
          paddingTop: 16, borderTop: "1px solid #EDE8E0",
        }}>
          {[
            { value: stats.recipes, label: "recepten" },
            { value: stats.favorites, label: "favorieten" },
            { value: stats.pantry, label: "voorraad" },
            { value: stats.shared, label: "gedeeld" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#3D2E1F" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#A89B8A" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit profile */}
      <div style={{
        background: "#FFFCF7", borderRadius: 24, padding: "28px 24px",
        boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 20,
        border: "1px solid #EDE8E0",
      }}>
        <h3 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#3D2E1F",
          margin: "0 0 20px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{
            background: "linear-gradient(135deg, #D4A574, #C09060)",
            borderRadius: 10, padding: "5px 9px", fontSize: 16,
          }}>✏️</span>
          Profiel bewerken
        </h3>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 6 }}>
            Weergavenaam
          </label>
          <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Je naam" style={inputStyle} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 8 }}>
            Favoriete keuken
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CUISINES.map(c => {
              const selected = favCuisine.includes(c);
              return (
                <button key={c} onClick={() => setFavCuisine(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])}
                  style={{
                    padding: "6px 14px", borderRadius: 20,
                    border: selected ? "2px solid #8B6F47" : "1.5px solid #D5CEC4",
                    background: selected ? "#8B6F4718" : "transparent",
                    color: selected ? "#8B6F47" : "#8C7E6F",
                    fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                    fontWeight: selected ? 600 : 400,
                    cursor: "pointer", transition: "all 0.2s",
                  }}>
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 8 }}>
            Dieetvoorkeuren
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DIETS.map(d => (
              <button key={d} onClick={() => toggleDiet(d)}
                style={{
                  padding: "6px 14px", borderRadius: 20,
                  border: dietPrefs.includes(d) ? "2px solid #6B8F5E" : "1.5px solid #D5CEC4",
                  background: dietPrefs.includes(d) ? "#6B8F5E18" : "transparent",
                  color: dietPrefs.includes(d) ? "#6B8F5E" : "#8C7E6F",
                  fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                  fontWeight: dietPrefs.includes(d) ? 600 : 400,
                  cursor: "pointer", transition: "all 0.2s",
                }}>
                {d}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 4 }}>
            Voorkeurs-supermarkt
          </label>
          <p style={{ fontSize: 11, color: "#A89B8A", margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif" }}>
            Je boodschappenlijst wordt gesorteerd op de gangpadindeling van jouw winkel
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {SUPERMARKETS.map(sm => {
              const selected = preferredSupermarket === sm.id;
              return (
                <button key={sm.id} onClick={() => setPreferredSupermarket(selected ? "" : sm.id)}
                  style={{
                    padding: "12px 8px", borderRadius: 14,
                    border: selected ? `2px solid ${sm.color}` : "1.5px solid #D5CEC4",
                    background: selected ? sm.color + "12" : "transparent",
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                  }}
                >
                  <img src={sm.logo} alt={sm.name} style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }} />
                  <span style={{
                    fontSize: 12, fontWeight: selected ? 700 : 500,
                    color: selected ? sm.color : "#8C7E6F",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{sm.name}</span>
                  {selected && (
                    <span style={{
                      fontSize: 9, color: sm.color, fontWeight: 700,
                      background: sm.color + "18", padding: "1px 8px", borderRadius: 8,
                    }}>GESELECTEERD</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          style={{
            width: "100%", padding: "16px", borderRadius: 14, border: "none",
            background: saved
              ? "linear-gradient(135deg, #6B8F5E, #5A7D4E)"
              : "linear-gradient(135deg, #D4A574 0%, #C09060 50%, #A67B50 100%)",
            color: "#fff", fontFamily: "'DM Sans', sans-serif",
            fontSize: 15, fontWeight: 700, cursor: saving ? "wait" : "pointer",
            transition: "all 0.3s",
            boxShadow: "0 6px 24px rgba(212,165,116,0.35)",
            opacity: saving ? 0.7 : 1,
          }}>
          {saved ? "Opgeslagen!" : saving ? "Opslaan..." : "Profiel opslaan"}
        </button>
      </div>

      {/* Logout */}
      <div style={{
        background: "#FFFCF7", borderRadius: 24, padding: "20px 24px",
        boxShadow: "0 4px 28px rgba(139,111,71,0.10)",
        border: "1px solid #EDE8E0",
      }}>
        <button onClick={handleLogout}
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: "1.5px solid #C85A3D", background: "transparent",
            color: "#C85A3D", fontFamily: "'DM Sans', sans-serif",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            transition: "all 0.2s",
          }}>
          Uitloggen
        </button>
      </div>
    </div>
  );
}
