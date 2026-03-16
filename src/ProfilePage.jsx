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
  const [preferredSupermarkets, setPreferredSupermarkets] = useState(profile?.preferred_supermarkets || []);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ recipes: 0, favorites: 0, pantry: 0, shared: 0 });
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerStatus, setPartnerStatus] = useState("");
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    loadStats();
    loadPartners();
  }, []);

  useEffect(() => {
    setDisplayName(profile?.display_name || "");
    setFavCuisine(profile?.favorite_cuisine || []);
    setDietPrefs(profile?.dietary_preferences || []);
    setPreferredSupermarkets(profile?.preferred_supermarkets || (profile?.preferred_supermarket ? [profile.preferred_supermarket] : []));
  }, [profile]);

  const loadPartners = async () => {
    const { data } = await supabase
      .from("partners")
      .select("user_id, partner_id, user_profile:user_id(display_name), partner_profile:partner_id(display_name)")
      .or(`user_id.eq.${user.id},partner_id.eq.${user.id}`);
    setPartners(data || []);
  };

  const invitePartner = async () => {
    if (!partnerEmail.trim()) return;
    setPartnerStatus("Zoeken...");
    const { data: targetId } = await supabase.rpc("get_user_id_by_email", { email_input: partnerEmail.trim() });
    if (!targetId) { setPartnerStatus("Gebruiker niet gevonden"); return; }
    if (targetId === user.id) { setPartnerStatus("Je kunt jezelf niet uitnodigen"); return; }
    const { error } = await supabase.from("partners").upsert({ user_id: user.id, partner_id: targetId });
    if (error) { setPartnerStatus("Er ging iets mis"); return; }
    setPartnerStatus("Partner gekoppeld!");
    setPartnerEmail("");
    loadPartners();
    setTimeout(() => setPartnerStatus(""), 2000);
  };

  const removePartner = async (partnerId) => {
    await supabase.from("partners").delete().or(`and(user_id.eq.${user.id},partner_id.eq.${partnerId}),and(user_id.eq.${partnerId},partner_id.eq.${user.id})`);
    loadPartners();
  };

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
      preferred_supermarket: preferredSupermarkets[0] || "",
      preferred_supermarkets: preferredSupermarkets,
    });
    if (!error) {
      setSaved(true);
      onProfileUpdate({ display_name: displayName, favorite_cuisine: favCuisine, dietary_preferences: dietPrefs, preferred_supermarket: preferredSupermarkets[0] || "", preferred_supermarkets: preferredSupermarkets });
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

        {/* Partner sectie */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 4 }}>
            Partner
          </label>
          <p style={{ fontSize: 11, color: "#A89B8A", margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif" }}>
            Deel je recepten en voorraadkast automatisch met je partner
          </p>
          {partners.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
              {partners.map(p => {
                const isMe = p.user_id === user.id;
                const name = isMe ? p.partner_profile?.display_name : p.user_profile?.display_name;
                const pid = isMe ? p.partner_id : p.user_id;
                return (
                  <div key={pid} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 12, background: "#6B8F5E10",
                    border: "1px solid #6B8F5E30",
                  }}>
                    <span style={{ fontSize: 13, color: "#3D2E1F", fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                      {name || "Partner"}
                    </span>
                    <button onClick={() => removePartner(pid)} style={{
                      background: "none", border: "none", color: "#C85A3D", fontSize: 12,
                      cursor: "pointer", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    }}>Ontkoppelen</button>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input type="email" value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && invitePartner()}
              placeholder="E-mailadres van je partner"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
              }} />
            <button onClick={invitePartner} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #D4A574, #C09060)",
              color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Koppel</button>
          </div>
          {partnerStatus && (
            <p style={{
              fontSize: 12, margin: "6px 0 0",
              color: partnerStatus.includes("gekoppeld") ? "#6B8F5E" : partnerStatus === "Zoeken..." ? "#8B6F47" : "#C85A3D",
            }}>{partnerStatus}</p>
          )}
        </div>

        {/* Supermarkten (multi-select) */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: "#8C7E6F", fontWeight: 600, display: "block", marginBottom: 4 }}>
            Voorkeurs-supermarkten
          </label>
          <p style={{ fontSize: 11, color: "#A89B8A", margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif" }}>
            Selecteer meerdere winkels — wissel in je boodschappenlijst per keer
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {SUPERMARKETS.map(sm => {
              const selected = preferredSupermarkets.includes(sm.id);
              const idx = preferredSupermarkets.indexOf(sm.id);
              return (
                <button key={sm.id} onClick={() => {
                  setPreferredSupermarkets(selected
                    ? preferredSupermarkets.filter(s => s !== sm.id)
                    : [...preferredSupermarkets, sm.id]
                  );
                }}
                  style={{
                    padding: "12px 8px", borderRadius: 14,
                    border: selected ? `2px solid ${sm.color}` : "1.5px solid #D5CEC4",
                    background: selected ? sm.color + "12" : "transparent",
                    cursor: "pointer", transition: "all 0.2s",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    position: "relative",
                  }}
                >
                  {selected && (
                    <span style={{
                      position: "absolute", top: 4, right: 6, fontSize: 9, fontWeight: 700,
                      color: "#fff", background: sm.color, width: 16, height: 16, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{idx + 1}</span>
                  )}
                  <img src={sm.logo} alt={sm.name} style={{ width: 36, height: 36, objectFit: "contain", borderRadius: 6 }} />
                  <span style={{
                    fontSize: 12, fontWeight: selected ? 700 : 500,
                    color: selected ? sm.color : "#8C7E6F",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{sm.name}</span>
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

      {/* Dark Mode */}
      <div style={{
        background: "#FFFCF7", borderRadius: 24, padding: "20px 24px",
        boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 20,
        border: "1px solid #EDE8E0",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#3D2E1F", margin: "0 0 4px",
            }}>Donkere modus</h3>
            <p style={{ fontSize: 12, color: "#A89B8A", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
              Rustiger voor je ogen in het donker
            </p>
          </div>
          <button onClick={async () => {
            const newVal = !profile?.dark_mode;
            onProfileUpdate({ dark_mode: newVal });
            await supabase.from("profiles").update({ dark_mode: newVal }).eq("id", user.id);
          }}
            style={{
              width: 52, height: 28, borderRadius: 14, border: "none",
              background: profile?.dark_mode ? "#6B8F5E" : "#E2DAD0",
              cursor: "pointer", position: "relative", transition: "background 0.3s",
              padding: 0,
            }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%", background: "#fff",
              position: "absolute", top: 3,
              left: profile?.dark_mode ? 27 : 3,
              transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            }} />
          </button>
        </div>
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
