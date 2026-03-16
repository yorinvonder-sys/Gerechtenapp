import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./src/supabaseClient";
import ProfilePage from "./src/ProfilePage.jsx";
import WeekPlanner from "./src/WeekPlanner.jsx";

const geminiCall = async (body) => {
  const devKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (devKey) {
    const model = body.model || "gemini-3-flash-preview";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${devKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: body.contents, generationConfig: body.generationConfig }),
    });
    return res.json();
  }
  const res = await fetch("/api/gemini", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
};

const CUISINES = ["Italiaans", "Aziatisch", "Mexicaans", "Frans", "Grieks", "Indiaas", "Japans", "Thais", "Hollands", "Amerikaans", "Midden-Oosters", "Afrikaans"];
const DIETS = ["Vegetarisch", "Veganistisch", "Glutenvrij", "Lactosevrij", "Koolhydraatarm", "Eiwitrijk"];
const TIMES = ["< 15 min", "15-30 min", "30-60 min", "> 60 min"];
const TAGS = ["Ontbijt", "Lunch", "Diner", "Snack", "Dessert", "Bijgerecht"];
const USERS = ["Lauran", "Yorin"];
const PANTRY_CATEGORIES = ["Groente & Fruit", "Vlees & Vis", "Zuivel", "Droog & Granen", "Kruiden & Specerijen", "Sauzen & Oliën", "Diepvries", "Overig"];

const CAT_EMOJIS = {
  "Groente & Fruit": "🥦", "Vlees & Vis": "🥩", "Zuivel": "🧀",
  "Droog & Granen": "🌾", "Kruiden & Specerijen": "🌿", "Sauzen & Oliën": "🫒",
  "Diepvries": "🧊", "Overig": "📦"
};

const CAT_ICONS = {
  "Groente & Fruit": "/images/cat-vegetables.webp",
  "Vlees & Vis": "/images/cat-meat.webp",
  "Zuivel": "/images/cat-dairy.webp",
  "Droog & Granen": "/images/cat-grains.webp",
  "Kruiden & Specerijen": "/images/cat-herbs.webp",
  "Sauzen & Oliën": "/images/cat-sauces.webp",
  "Diepvries": "/images/cat-frozen.webp",
  "Overig": "/images/cat-other.webp",
};

const NAV_ICONS = {
  recepten: "/images/nav-recipes.webp",
  voorraad: "/images/nav-pantry.webp",
  profiel: "/images/nav-profile.webp",
};

const CUISINE_VISUALS = {
  "Italiaans": { gradient: "linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)", emoji: "🍝", pattern: "🍕🫒🍷" },
  "Aziatisch": { gradient: "linear-gradient(135deg, #27AE60 0%, #1E8449 100%)", emoji: "🥢", pattern: "🍜🥟🍱" },
  "Mexicaans": { gradient: "linear-gradient(135deg, #E67E22 0%, #D35400 100%)", emoji: "🌮", pattern: "🌶️🫔🥑" },
  "Frans": { gradient: "linear-gradient(135deg, #8E44AD 0%, #6C3483 100%)", emoji: "🥐", pattern: "🧀🍷🥖" },
  "Grieks": { gradient: "linear-gradient(135deg, #2980B9 0%, #1A5276 100%)", emoji: "🫒", pattern: "🥗🫒🧀" },
  "Indiaas": { gradient: "linear-gradient(135deg, #F39C12 0%, #E67E22 100%)", emoji: "🍛", pattern: "🌶️🍚🫓" },
  "Japans": { gradient: "linear-gradient(135deg, #E84393 0%, #C2185B 100%)", emoji: "🍣", pattern: "🍱🍙🍣" },
  "Thais": { gradient: "linear-gradient(135deg, #00B894 0%, #00876C 100%)", emoji: "🍲", pattern: "🥘🌿🍜" },
  "Hollands": { gradient: "linear-gradient(135deg, #FF6B35 0%, #E55B25 100%)", emoji: "🧇", pattern: "🧀🥔🧇" },
  "Amerikaans": { gradient: "linear-gradient(135deg, #3498DB 0%, #2471A3 100%)", emoji: "🍔", pattern: "🌽🥩🍟" },
  "Midden-Oosters": { gradient: "linear-gradient(135deg, #D4A574 0%, #B8860B 100%)", emoji: "🧆", pattern: "🧆🫓🌿" },
  "Afrikaans": { gradient: "linear-gradient(135deg, #E74C3C 0%, #F39C12 100%)", emoji: "🍖", pattern: "🥘🌶️🍠" },
};
const DEFAULT_VISUAL = { gradient: "linear-gradient(135deg, #8B6F47 0%, #6B5D4F 100%)", emoji: "🍽️", pattern: "🍴🥄🍳" };

const NAV_ITEMS = [
  { id: "recepten", icon: "🍳", label: "Recepten" },
  { id: "voorraad", icon: "🧊", label: "Voorraadkast" },
  { id: "weekplanner", icon: "📅", label: "Weekplanner" },
  { id: "profiel", icon: "⚙️", label: "Instellingen" },
];

/* ─── Shared Components ─── */

function StarRating({ rating, onChange, size = 20 }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} onClick={() => onChange?.(star === rating ? 0 : star)}
          style={{
            background: "none", border: "none", cursor: onChange ? "pointer" : "default",
            fontSize: size, padding: 0, color: star <= rating ? "#D4A574" : "#D5CEC4",
            transition: "transform 0.15s, color 0.2s",
          }}
          onMouseEnter={(e) => onChange && (e.target.style.transform = "scale(1.2)")}
          onMouseLeave={(e) => onChange && (e.target.style.transform = "scale(1)")}
        >★</button>
      ))}
    </div>
  );
}

function TagPill({ label, active, onClick, color }) {
  return (
    <button onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: 20,
        border: active ? "2px solid " + (color || "#8B6F47") : "1.5px solid #D5CEC4",
        background: active ? (color || "#8B6F47") + "18" : "transparent",
        color: active ? (color || "#8B6F47") : "#8C7E6F",
        fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: active ? 600 : 400,
        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
      }}
    >{label}</button>
  );
}

function CustomSelect({ value, onChange, options, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder || "Kies...";

  return (
    <div ref={ref} style={{ position: "relative", flex: "1 1 0", minWidth: 0 }}>
      <button onClick={() => setOpen(!open)}
        style={{
          width: "100%", padding: "10px 32px 10px 14px", borderRadius: 12,
          border: open ? "1.5px solid #8B6F47" : "1.5px solid #E2DAD0",
          background: "#FAF7F2", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
          color: value ? "#3D2E1F" : "#A89B8A", cursor: "pointer", textAlign: "left",
          transition: "all 0.2s", position: "relative", whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}
      >
        {selectedLabel}
        <span style={{
          position: "absolute", right: 12, top: "50%", transform: `translateY(-50%) rotate(${open ? 180 : 0}deg)`,
          fontSize: 10, color: "#A89B8A", transition: "transform 0.2s", pointerEvents: "none",
        }}>▼</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#FFFCF7", borderRadius: 12, border: "1px solid #E2DAD0",
          boxShadow: "0 8px 32px rgba(139,111,71,0.15)", zIndex: 100,
          maxHeight: 220, overflowY: "auto", animation: "fadeIn 0.15s ease",
        }}>
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: "100%", padding: "10px 14px", border: "none",
                background: opt.value === value ? "#8B6F4712" : "transparent",
                color: opt.value === value ? "#8B6F47" : "#3D2E1F",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                fontWeight: opt.value === value ? 600 : 400,
                cursor: "pointer", textAlign: "left", transition: "background 0.15s",
                borderBottom: "1px solid #F0EBE4",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={(e) => e.target.style.background = "#F5EDE3"}
              onMouseLeave={(e) => e.target.style.background = opt.value === value ? "#8B6F4712" : "transparent"}
            >
              {opt.value === value && <span style={{ fontSize: 11, color: "#8B6F47" }}>✓</span>}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Fridge Scanner ─── */

function FridgeScanner({ onItemsDetected, existingItems }) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview] = useState(null);
  const [scanResults, setScanResults] = useState(null);
  const [scanStatus, setScanStatus] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const statusMessages = [
    "📸 Foto wordt geanalyseerd...",
    "🔍 Producten herkennen...",
    "⚖️ Hoeveelheden inschatten...",
    "📝 Resultaten voorbereiden...",
  ];

  const processImage = async (file) => {
    setScanning(true);
    setScanResults(null);
    setScanStatus(statusMessages[0]);

    // Convert to base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        setPreview(result);
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    // Determine media type
    const mediaType = file.type || "image/jpeg";

    // Cycle status messages
    let msgIndex = 0;
    const statusInterval = setInterval(() => {
      msgIndex = Math.min(msgIndex + 1, statusMessages.length - 1);
      setScanStatus(statusMessages[msgIndex]);
    }, 2500);

    try {
      const data = await geminiCall({
        contents: [{ parts: [
          { inlineData: { mimeType: mediaType, data: base64 } },
          { text: `Analyseer deze foto van een koelkast/voorraad. Identificeer ALLE zichtbare producten. Maak voor elk product een inschatting van de hoeveelheid die er nog over is (in gram, ml, stuks, of een beschrijving zoals "half pak", "bijna op").

Bij doorzichtige verpakkingen of goed zichtbare producten: geef een zo precies mogelijke schatting.
Bij ondoorzichtige verpakkingen: geef een schatting op basis van hoe vol/zwaar het eruitziet.

Categoriseer elk product in een van deze categorieën: Groente & Fruit, Vlees & Vis, Zuivel, Droog & Granen, Kruiden & Specerijen, Sauzen & Oliën, Diepvries, Overig.

Antwoord ALLEEN met valid JSON in dit formaat, zonder markdown of backticks:
{"items":[{"name":"productnaam","category":"categorie","quantity":"geschatte hoeveelheid","confidence":"hoog/middel/laag"}]}` }
        ] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192, responseMimeType: "application/json" },
      });

      clearInterval(statusInterval);
      if (data.error) throw new Error(data.error.message || "API fout");

      const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);

      if (parsed.items && parsed.items.length > 0) {
        // Filter out items already in pantry
        const existingNames = existingItems.map(i => i.name.toLowerCase());
        const newItems = parsed.items.map(item => ({
          ...item,
          alreadyExists: existingNames.some(n =>
            n.includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(n)
          ),
        }));
        setScanResults(newItems);
        setSelectedItems(newItems.filter(i => !i.alreadyExists).map((_, idx) => idx));
      } else {
        setScanResults([]);
      }
      setScanStatus("");
    } catch (err) {
      clearInterval(statusInterval);
      setScanStatus("");
      setScanResults("error");
      console.error("Scan error:", err);
    }
    setScanning(false);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
    e.target.value = "";
  };

  const toggleItem = (idx) => {
    setSelectedItems(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const addSelectedToFridge = () => {
    if (!scanResults || scanResults === "error") return;
    const toAdd = selectedItems.map(idx => scanResults[idx]).filter(Boolean).map(item => ({
      name: item.quantity ? `${item.name} (±${item.quantity})` : item.name,
      category: PANTRY_CATEGORIES.includes(item.category) ? item.category : "Overig",
      id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    }));
    onItemsDetected(toAdd);
    setScanResults(null);
    setPreview(null);
    setSelectedItems([]);
  };

  const confidenceColor = { hoog: "#6B8F5E", middel: "#D4A574", laag: "#C85A3D" };

  return (
    <div style={{
      background: "linear-gradient(135deg, #F0F7ED, #E8F2E4)", borderRadius: 16,
      padding: 20, border: "1.5px solid #C5DDB8",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 26 }}>📸</span>
        <div>
          <h3 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#3D2E1F",
            margin: 0, lineHeight: 1.2
          }}>Koelkast Scanner</h3>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B8F5E",
            margin: "2px 0 0"
          }}>Maak een foto en AI herkent je producten</p>
        </div>
      </div>

      {!preview && !scanning && (
        <div style={{ display: "flex", gap: 10 }}>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment"
            onChange={handleFile} style={{ display: "none" }} />
          <input ref={fileInputRef} type="file" accept="image/*"
            onChange={handleFile} style={{ display: "none" }} />
          <button onClick={() => cameraInputRef.current?.click()}
            style={{
              flex: 1, padding: "14px 16px", borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #6B8F5E, #5A7D4E)",
              color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
              boxShadow: "0 3px 12px rgba(107,143,94,0.25)",
            }}
            onMouseEnter={(e) => e.target.style.boxShadow = "0 5px 20px rgba(107,143,94,0.35)"}
            onMouseLeave={(e) => e.target.style.boxShadow = "0 3px 12px rgba(107,143,94,0.25)"}
          >📷 Foto maken</button>
          <button onClick={() => fileInputRef.current?.click()}
            style={{
              flex: 1, padding: "14px 16px", borderRadius: 12,
              border: "1.5px solid #6B8F5E", background: "transparent",
              color: "#5A7D4E", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
              fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
            }}
          >🖼️ Kies foto</button>
        </div>
      )}

      {/* Scanning animation */}
      {scanning && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          {preview && (
            <div style={{ position: "relative", marginBottom: 14, borderRadius: 12, overflow: "hidden" }}>
              <img src={preview} alt="Koelkast" style={{
                width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 12,
                filter: "brightness(0.85)",
              }} />
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                background: "linear-gradient(0deg, rgba(107,143,94,0.4) 0%, transparent 50%)",
                borderRadius: 12,
              }} />
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: "#6B8F5E", animation: "scanLine 2s ease-in-out infinite",
                boxShadow: "0 0 20px rgba(107,143,94,0.6)",
              }} />
            </div>
          )}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#fff", borderRadius: 24, padding: "10px 20px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          }}>
            <div style={{
              width: 18, height: 18, border: "2.5px solid #6B8F5E",
              borderTopColor: "transparent", borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3D2E1F",
              fontWeight: 500,
            }}>{scanStatus}</span>
          </div>
        </div>
      )}

      {/* Results */}
      {scanResults && scanResults !== "error" && scanResults.length > 0 && (
        <div style={{ animation: "fadeIn 0.4s ease" }}>
          {preview && (
            <div style={{ marginBottom: 14, borderRadius: 12, overflow: "hidden" }}>
              <img src={preview} alt="Koelkast" style={{
                width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 12,
              }} />
            </div>
          )}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: 10,
          }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
              color: "#3D2E1F", margin: 0,
            }}>
              ✅ {scanResults.length} product{scanResults.length !== 1 ? "en" : ""} herkend
            </p>
            <button onClick={() => {
              if (selectedItems.length === scanResults.filter(i => !i.alreadyExists).length) {
                setSelectedItems([]);
              } else {
                setSelectedItems(scanResults.map((item, idx) => !item.alreadyExists ? idx : null).filter(i => i !== null));
              }
            }} style={{
              background: "none", border: "none", color: "#6B8F5E",
              fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer",
              fontWeight: 600,
            }}>
              {selectedItems.length === scanResults.filter(i => !i.alreadyExists).length ? "Deselecteer alles" : "Selecteer alles"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {scanResults.map((item, idx) => (
              <button key={idx}
                onClick={() => !item.alreadyExists && toggleItem(idx)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px", borderRadius: 10,
                  border: item.alreadyExists
                    ? "1.5px solid #E2DAD0"
                    : selectedItems.includes(idx) ? "2px solid #6B8F5E" : "1.5px solid #D5CEC4",
                  background: item.alreadyExists
                    ? "#F5F2ED"
                    : selectedItems.includes(idx) ? "#6B8F5E10" : "#FFFCF7",
                  cursor: item.alreadyExists ? "default" : "pointer",
                  opacity: item.alreadyExists ? 0.6 : 1,
                  transition: "all 0.2s", textAlign: "left", width: "100%",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: item.alreadyExists ? "#E2DAD0" : selectedItems.includes(idx) ? "#6B8F5E" : "#EDE8E0",
                  color: item.alreadyExists ? "#B5A999" : selectedItems.includes(idx) ? "#fff" : "#B5A999",
                  transition: "all 0.2s",
                }}>
                  {item.alreadyExists ? "—" : selectedItems.includes(idx) ? "✓" : ""}
                </span>
                <img src={CAT_ICONS[item.category] || CAT_ICONS["Overig"]} alt={item.category}
                  style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: "#3D2E1F", fontWeight: 500 }}>
                    {item.name}
                    {item.alreadyExists && (
                      <span style={{ fontSize: 11, color: "#B5A999", marginLeft: 6 }}>al in voorraad</span>
                    )}
                  </div>
                  {item.quantity && (
                    <div style={{ fontSize: 12, color: "#8C7E6F", marginTop: 1 }}>
                      ±{item.quantity}
                    </div>
                  )}
                </div>
                {item.confidence && (
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 8,
                    background: (confidenceColor[item.confidence] || "#B5A999") + "18",
                    color: confidenceColor[item.confidence] || "#B5A999",
                    fontWeight: 600, flexShrink: 0,
                  }}>
                    {item.confidence === "hoog" ? "🎯" : item.confidence === "middel" ? "🤔" : "❓"} {item.confidence}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addSelectedToFridge}
              disabled={selectedItems.length === 0}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 12, border: "none",
                background: selectedItems.length > 0
                  ? "linear-gradient(135deg, #6B8F5E, #5A7D4E)" : "#E2DAD0",
                color: selectedItems.length > 0 ? "#fff" : "#B5A999",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                fontWeight: 600, cursor: selectedItems.length > 0 ? "pointer" : "default",
                transition: "all 0.2s",
              }}
            >
              ➕ {selectedItems.length} product{selectedItems.length !== 1 ? "en" : ""} toevoegen
            </button>
            <button onClick={() => { setScanResults(null); setPreview(null); setSelectedItems([]); }}
              style={{
                padding: "12px 16px", borderRadius: 12,
                border: "1.5px solid #D5CEC4", background: "transparent",
                color: "#8C7E6F", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                fontWeight: 500, cursor: "pointer",
              }}
            >Opnieuw</button>
          </div>
        </div>
      )}

      {scanResults && scanResults !== "error" && scanResults.length === 0 && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#8C7E6F" }}>
            Geen producten herkend. Probeer een duidelijkere foto te maken.
          </p>
          <button onClick={() => { setScanResults(null); setPreview(null); }}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "#6B8F5E", color: "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", marginTop: 8,
            }}
          >Opnieuw proberen</button>
        </div>
      )}

      {scanResults === "error" && (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#C85A3D" }}>
            Er ging iets mis bij het analyseren. Probeer het opnieuw.
          </p>
          <button onClick={() => { setScanResults(null); setPreview(null); }}
            style={{
              padding: "10px 20px", borderRadius: 10, border: "none",
              background: "#6B8F5E", color: "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", marginTop: 8,
            }}
          >Opnieuw proberen</button>
        </div>
      )}
    </div>
  );
}

/* ─── Card Hand (Picnic-style horizontal carousel) ─── */

function CardHand({ recipes, onToggleFav, onRate, onDelete, onTagChange, onShare, onMarkCooked, collections, onAddToCollection, onRemoveFromCollection, onAddToPlanner }) {
  const [expandedId, setExpandedId] = useState(null);
  const scrollRef = useRef(null);

  // If a card is expanded, show full RecipeCard
  if (expandedId) {
    const recipe = recipes.find(r => r.id === expandedId);
    if (!recipe) { setExpandedId(null); return null; }
    return (
      <div style={{ animation: "fadeIn 0.3s ease" }}>
        <button onClick={() => setExpandedId(null)}
          style={{
            background: "none", border: "none", color: "#8B6F47", fontSize: 13,
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, cursor: "pointer",
            padding: "0 0 10px", display: "flex", alignItems: "center", gap: 4,
          }}>← Terug naar overzicht</button>
        <RecipeCard recipe={recipe} onToggleFav={onToggleFav}
          onRate={onRate} onDelete={onDelete} onTagChange={onTagChange} onShare={onShare}
          onMarkCooked={onMarkCooked} collections={collections}
          onAddToCollection={onAddToCollection} onRemoveFromCollection={onRemoveFromCollection} onAddToPlanner={onAddToPlanner} />
      </div>
    );
  }

  return (
    <div>
      {/* Horizontal scrollable card carousel */}
      <div ref={scrollRef} style={{
        display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8,
        scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
        scrollbarWidth: "none", msOverflowStyle: "none",
        margin: "0 -16px", padding: "4px 16px 12px",
      }}>
        {recipes.map((recipe, idx) => {
          const vis = CUISINE_VISUALS[recipe.cuisine] || DEFAULT_VISUAL;
          return (
            <button key={recipe.id}
              onClick={() => setExpandedId(recipe.id)}
              style={{
                flex: "0 0 280px", scrollSnapAlign: "start",
                borderRadius: 20, border: "none", overflow: "hidden",
                background: "#FFFCF7", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(139,111,71,0.10)",
                transition: "all 0.3s ease", textAlign: "left",
                display: "flex", flexDirection: "column",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,111,71,0.20)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,111,71,0.10)";
              }}
            >
              {/* Image area */}
              <div style={{
                height: 140, width: "100%", position: "relative",
                background: vis.gradient, overflow: "hidden",
              }}>
                {recipe.imageUrl && (
                  <img src={recipe.imageUrl} alt={recipe.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {!recipe.imageUrl && (
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 48, opacity: 0.2, letterSpacing: 12,
                  }}>{vis.pattern}</div>
                )}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 60,
                  background: "linear-gradient(transparent, rgba(0,0,0,0.45))",
                }} />
                {/* Badges */}
                <div style={{
                  position: "absolute", top: 10, left: 10,
                  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                  borderRadius: 20, padding: "4px 10px",
                  fontSize: 11, fontWeight: 600, color: "#6B5D4F",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{vis.emoji} {recipe.cuisine}</div>
                <div style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                  borderRadius: 20, padding: "4px 10px",
                  fontSize: 11, fontWeight: 500, color: "#6B5D4F",
                  fontFamily: "'DM Sans', sans-serif",
                }}>⏱ {recipe.prepTime}</div>
                {recipe.favorite && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    background: "rgba(200,90,61,0.9)", borderRadius: 20, padding: "4px 8px",
                    fontSize: 11, color: "#fff",
                  }}>❤️</div>
                )}
                {recipe.rating > 0 && (
                  <div style={{
                    position: "absolute", bottom: 10, right: 10,
                    background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                    borderRadius: 20, padding: "4px 8px",
                    fontSize: 11, fontWeight: 600, color: "#D4A574",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>{"★".repeat(recipe.rating)}</div>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 700,
                  color: "#3D2E1F", margin: "0 0 6px", lineHeight: 1.3,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{recipe.title}</h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#8C7E6F",
                  margin: "0 0 10px", lineHeight: 1.4, flex: 1,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>{recipe.description}</p>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  paddingTop: 10, borderTop: "1px solid #F0EBE4",
                }}>
                  <span style={{ fontSize: 11, color: "#A89B8A", fontFamily: "'DM Sans', sans-serif" }}>
                    👨‍🍳 {recipe.addedBy} · 👥 {recipe.servings || 2}p
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 600, color: "#D4A574",
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Bekijk →</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Scroll indicator dots */}
      {recipes.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 4 }}>
          {recipes.map((_, i) => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: "50%",
              background: i === 0 ? "#D4A574" : "#E2DAD0",
              transition: "background 0.2s",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Pantry Section ─── */

function PantrySection({ pantry, onAdd, onAddMultiple, onRemove, onClear }) {
  const [newItem, setNewItem] = useState("");
  const [selectedCat, setSelectedCat] = useState("Overig");
  const [showAdd, setShowAdd] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [filterCat, setFilterCat] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const inputRef = useRef(null);

  const addItem = () => {
    const trimmed = newItem.trim();
    if (!trimmed) return;
    onAdd({ name: trimmed, category: selectedCat, id: Date.now().toString() });
    setNewItem("");
    inputRef.current?.focus();
  };

  const grouped = {};
  const items = filterCat ? pantry.filter(p => p.category === filterCat) : pantry;
  items.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  return (
    <div style={{
      background: "#FFFCF7", borderRadius: 20, padding: "22px 24px",
      boxShadow: "0 4px 24px rgba(139,111,71,0.08)", marginBottom: 20,
      border: "1px solid #EDE8E0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{
          fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#3D2E1F",
          margin: 0, display: "flex", alignItems: "center", gap: 8
        }}>🧊 Voorraadkast
          <span style={{ fontSize: 12, color: "#A89B8A", fontFamily: "'DM Sans', sans-serif", fontWeight: 400 }}>
            ({pantry.length})
          </span>
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => { setShowScanner(!showScanner); if (showAdd) setShowAdd(false); }}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none",
              background: showScanner ? "#EDE8E0" : "linear-gradient(135deg, #D4A574, #C09060)",
              color: showScanner ? "#8C7E6F" : "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >{showScanner ? "Sluiten" : "📸 Scan"}</button>
          <button onClick={() => { setShowAdd(!showAdd); if (showScanner) setShowScanner(false); setTimeout(() => inputRef.current?.focus(), 100); }}
            style={{
              padding: "7px 14px", borderRadius: 20, border: "none",
              background: showAdd ? "#EDE8E0" : "linear-gradient(135deg, #6B8F5E, #5A7D4E)",
              color: showAdd ? "#8C7E6F" : "#fff",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              cursor: "pointer", transition: "all 0.2s",
            }}
          >{showAdd ? "Sluiten" : "+ Toevoegen"}</button>
        </div>
      </div>

      {/* Fridge Scanner */}
      {showScanner && (
        <div style={{ marginBottom: 16, animation: "fadeIn 0.3s ease" }}>
          <FridgeScanner
            existingItems={pantry}
            onItemsDetected={(items) => {
              onAddMultiple(items);
              setShowScanner(false);
            }}
          />
        </div>
      )}

      {/* Manual add */}
      {showAdd && (
        <div style={{
          background: "#F8F4ED", borderRadius: 14, padding: 16, marginBottom: 16,
          animation: "fadeIn 0.3s ease",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
            <input ref={inputRef} value={newItem} onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="Bijv. kipfilet, rijst, paprika..."
              style={{
                width: "100%", padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #E2DAD0", background: "#FFFCF7",
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3D2E1F",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <CustomSelect value={selectedCat} onChange={setSelectedCat}
                options={PANTRY_CATEGORIES.map(c => ({ value: c, label: `${CAT_EMOJIS[c]} ${c}` }))}
                placeholder="Categorie"
              />
              <button onClick={addItem}
                style={{
                  padding: "10px 20px", borderRadius: 10, border: "none",
                  background: "#6B8F5E", color: "#fff", flexShrink: 0,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, cursor: "pointer",
                }}
              >Toevoegen</button>
            </div>
          </div>
          <p style={{ fontSize: 11, color: "#B5A999", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            💡 Druk op Enter om snel achter elkaar producten toe te voegen
          </p>
        </div>
      )}

      {/* Pantry items */}
      {pantry.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            <TagPill label="Alles" active={!filterCat} onClick={() => setFilterCat("")} color="#6B8F5E" />
            {[...new Set(pantry.map(p => p.category))].map(cat => (
              <TagPill key={cat} label={`${CAT_EMOJIS[cat] || ""} ${cat}`} active={filterCat === cat}
                onClick={() => setFilterCat(filterCat === cat ? "" : cat)} color="#6B8F5E" />
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([cat, catItems]) => (
              <div key={cat}>
                <p style={{
                  fontSize: 12, fontWeight: 600, color: "#8C7E6F", margin: "0 0 6px",
                  fontFamily: "'DM Sans', sans-serif",
                  display: "flex", alignItems: "center", gap: 6,
                }}><img src={CAT_ICONS[cat] || CAT_ICONS["Overig"]} alt={cat}
                  style={{ width: 20, height: 20, objectFit: "contain", borderRadius: 3 }} /> {cat}</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {catItems.map(item => (
                    <div key={item.id} style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "#EDE8E0", borderRadius: 20, padding: "5px 8px 5px 12px",
                      fontSize: 13, color: "#5C4632", fontFamily: "'DM Sans', sans-serif",
                      animation: "fadeIn 0.2s ease",
                    }}>
                      {item.name}
                      <button onClick={() => onRemove(item.id)}
                        style={{
                          background: "none", border: "none", color: "#B5A999",
                          cursor: "pointer", fontSize: 14, padding: "0 2px",
                          lineHeight: 1, transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => e.target.style.color = "#C85A3D"}
                        onMouseLeave={(e) => e.target.style.color = "#B5A999"}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {pantry.length > 3 && (
            <div style={{ marginTop: 14 }}>
              {!showClearConfirm ? (
                <button onClick={() => setShowClearConfirm(true)}
                  style={{
                    background: "none", border: "1px solid #E2DAD0",
                    color: "#B5A999", borderRadius: 10, padding: "6px 14px",
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = "#C85A3D"; e.target.style.color = "#C85A3D"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "#E2DAD0"; e.target.style.color = "#B5A999"; }}
                >🗑️ Voorraad legen</button>
              ) : (
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "#8C7E6F", fontFamily: "'DM Sans', sans-serif" }}>Weet je het zeker?</span>
                  <button onClick={() => { onClear(); setShowClearConfirm(false); }}
                    style={{
                      background: "#C85A3D", color: "#fff", border: "none", borderRadius: 8,
                      padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
                    }}
                  >Ja, alles weg</button>
                  <button onClick={() => setShowClearConfirm(false)}
                    style={{
                      background: "#EDE8E0", color: "#8C7E6F", border: "none", borderRadius: 8,
                      padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}
                  >Nee</button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {pantry.length === 0 && !showAdd && !showScanner && (
        <div style={{
          textAlign: "center", padding: "20px 0 8px", color: "#B5A999",
          fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        }}>
          <div style={{ fontSize: 32, marginBottom: 6 }}>🛒</div>
          Scan je koelkast of voeg handmatig producten toe
        </div>
      )}
    </div>
  );
}

/* ─── Recipe Card ─── */

function RecipeCard({ recipe, onToggleFav, onRate, onDelete, onTagChange, onShare, onMarkCooked, collections, onAddToCollection, onRemoveFromCollection, onAddToPlanner }) {
  const [expanded, setExpanded] = useState(false);
  const [showPlannerPicker, setShowPlannerPicker] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedMealType, setSelectedMealType] = useState("diner");
  const [plannerStatus, setPlannerStatus] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const visual = CUISINE_VISUALS[recipe.cuisine] || DEFAULT_VISUAL;
  const daysSinceCooked = recipe.lastCookedAt ? Math.floor((Date.now() - new Date(recipe.lastCookedAt).getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div style={{
      background: "#FFFCF7", borderRadius: 20, overflow: "hidden",
      boxShadow: "0 2px 20px rgba(139,111,71,0.10)", transition: "all 0.3s",
      border: "1px solid #EDE8E0", animation: "fadeIn 0.4s ease",
    }}
      onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,111,71,0.18)"}
      onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 2px 20px rgba(139,111,71,0.10)"}
    >
      {/* Recipe Hero Banner */}
      <div style={{
        background: visual.gradient, padding: "24px 22px 20px",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 60, opacity: 0.12, letterSpacing: 20,
          pointerEvents: "none", userSelect: "none",
        }}>{visual.pattern}</div>
        <div style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              {recipe.cuisine && (
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.2)",
                  borderRadius: 20, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600, backdropFilter: "blur(10px)",
                }}>{visual.emoji} {recipe.cuisine}</span>
              )}
              {recipe.prepTime && (
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.2)",
                  borderRadius: 20, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500, backdropFilter: "blur(10px)",
                }}>⏱ {recipe.prepTime}</span>
              )}
              {recipe.usedPantry && (
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.9)", background: "rgba(255,255,255,0.2)",
                  borderRadius: 20, padding: "3px 10px", fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 500, backdropFilter: "blur(10px)",
                }}>🧊 Voorraad</span>
              )}
            </div>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#fff",
              margin: 0, lineHeight: 1.3, textShadow: "0 1px 3px rgba(0,0,0,0.15)",
            }}>{recipe.title}</h3>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <button onClick={() => onToggleFav(recipe.id)}
              style={{
                background: "rgba(255,255,255,0.2)", border: "none", fontSize: 20, cursor: "pointer",
                color: recipe.favorite ? "#fff" : "rgba(255,255,255,0.6)", transition: "all 0.2s",
                padding: "6px 8px", borderRadius: 12, backdropFilter: "blur(10px)",
              }}
            >{recipe.favorite ? "❤️" : "🤍"}</button>
            <button onClick={(e) => {
              e.stopPropagation();
              if (!showPlannerPicker) {
                const t = new Date(); t.setHours(0,0,0,0);
                setSelectedDays([t.toISOString().split("T")[0]]);
                setSelectedMealType("diner");
                setPlannerStatus("");
              }
              setShowPlannerPicker(!showPlannerPicker);
            }}
              style={{
                background: showPlannerPicker ? "rgba(107,143,94,0.4)" : "rgba(255,255,255,0.2)",
                border: "none", cursor: "pointer",
                padding: "6px 8px", borderRadius: 12, backdropFilter: "blur(10px)",
                transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="3" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" fill="none" />
                <line x1="3" y1="9" x2="21" y2="9" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
                <line x1="8" y1="2.5" x2="8" y2="5.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="16" y1="2.5" x2="16" y2="5.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="12" y1="13" x2="12" y2="18" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
                <line x1="9.5" y1="15.5" x2="14.5" y2="15.5" stroke="rgba(255,255,255,0.9)" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {!showConfirm ? (
              <button onClick={() => setShowConfirm(true)}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "none", fontSize: 14, cursor: "pointer",
                  color: "rgba(255,255,255,0.6)", padding: "6px 8px", borderRadius: 12,
                  transition: "all 0.2s", backdropFilter: "blur(10px)",
                }}
              >✕</button>
            ) : (
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => onDelete(recipe.id)} style={{
                  background: "rgba(200,90,61,0.9)", color: "#fff", border: "none", borderRadius: 10,
                  padding: "5px 12px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 600, backdropFilter: "blur(10px)",
                }}>Weg</button>
                <button onClick={() => setShowConfirm(false)} style={{
                  background: "rgba(255,255,255,0.25)", color: "#fff", border: "none", borderRadius: 10,
                  padding: "5px 10px", fontSize: 11, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  backdropFilter: "blur(10px)",
                }}>Nee</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 22px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <span style={{
            fontSize: 11, color: "#FFFCF7", background: recipe.isShared ? "#6B8F5E" : "#A68B6B", borderRadius: 10,
            padding: "2px 10px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500
          }}>{recipe.isShared ? "📨 Gedeeld door" : "👨‍🍳"} {recipe.addedBy}</span>
          {recipe.servings && (
            <span style={{ fontSize: 12, color: "#8C7E6F", fontFamily: "'DM Sans', sans-serif" }}>👥 {recipe.servings}p</span>
          )}
          <span style={{
            fontSize: 11, color: daysSinceCooked !== null ? "#6B8F5E" : "#B5A999",
            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
            background: daysSinceCooked !== null ? "#6B8F5E12" : "#F5F2ED",
            borderRadius: 8, padding: "2px 8px",
          }}>
            {daysSinceCooked !== null
              ? daysSinceCooked === 0 ? "🍳 Vandaag gekookt" : `🍳 ${daysSinceCooked}d geleden`
              : "Nog nooit gekookt"}
          </span>
        </div>

        <p style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6B5D4F",
          lineHeight: 1.6, margin: "0 0 12px", fontStyle: "italic"
        }}>{recipe.description}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
          <StarRating rating={recipe.rating || 0} onChange={(r) => onRate(recipe.id, r)} size={18} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TAGS.map((tag) => (
              <TagPill key={tag} label={tag} active={recipe.tags?.includes(tag)}
                onClick={() => onTagChange(recipe.id, tag)} color="#6B8F5E" />
            ))}
          </div>
        </div>

        <button onClick={() => setExpanded(!expanded)}
          style={{
            background: expanded ? "#8B6F4710" : "transparent", border: "1.5px solid #E2DAD0",
            color: "#8B6F47", borderRadius: 12, width: "100%",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer",
            padding: "10px 16px", fontWeight: 600, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 6, transition: "all 0.2s",
          }}
          onMouseEnter={(e) => { e.target.style.background = "#8B6F4715"; e.target.style.borderColor = "#8B6F47"; }}
          onMouseLeave={(e) => { e.target.style.background = expanded ? "#8B6F4710" : "transparent"; e.target.style.borderColor = "#E2DAD0"; }}
        >{expanded ? "Verberg details ▲" : "📖 Bekijk volledig recept ▼"}</button>

        {showPlannerPicker && (() => {
          const _t = new Date(); _t.setHours(0, 0, 0, 0);
          const _dow = _t.getDay();
          const _mon = new Date(_t); _mon.setDate(_t.getDate() - (_dow === 0 ? 6 : _dow - 1));
          const _wk = Array.from({ length: 7 }, (_, i) => { const d = new Date(_mon); d.setDate(_mon.getDate() + i); return d; });
          const _nM = new Date(_mon); _nM.setDate(_mon.getDate() + 7);
          const _nWk = Array.from({ length: 7 }, (_, i) => { const d = new Date(_nM); d.setDate(_nM.getDate() + i); return d; });
          const _ds = ["Zo","Ma","Di","Wo","Do","Vr","Za"];
          const _mts = [{id:"ontbijt",l:"Ontbijt",e:"🥐"},{id:"lunch",l:"Lunch",e:"🥗"},{id:"diner",l:"Diner",e:"🍽️"}];
          const _tog = (s) => setSelectedDays(p => p.includes(s) ? p.filter(x=>x!==s) : [...p, s]);
          const _isT = (d) => d.getDate()===_t.getDate()&&d.getMonth()===_t.getMonth()&&d.getFullYear()===_t.getFullYear();
          const _isP = (d) => d < _t;
          const renderDay = (d, dis) => { const s=d.toISOString().split("T")[0]; const sel=selectedDays.includes(s); return (
            <button key={s} onClick={()=>!dis&&_tog(s)} style={{flex:1,padding:"6px 2px",borderRadius:10,border:"none",background:sel?"linear-gradient(135deg,#6B8F5E,#5A7D4E)":_isT(d)?"#D4A57420":"transparent",color:sel?"#fff":dis?"#D5CFC6":"#3D2E1F",fontSize:11,fontFamily:"'DM Sans',sans-serif",fontWeight:600,cursor:dis?"default":"pointer",transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:1,opacity:dis?0.5:1}}>
              <span style={{fontSize:9,fontWeight:700,opacity:0.7}}>{_ds[d.getDay()]}</span><span>{d.getDate()}</span>
            </button>);};
          return (
            <div style={{marginTop:8,padding:"16px",borderRadius:14,background:"#FAF7F2",border:"1.5px solid #6B8F5E40",animation:"fadeIn 0.2s ease"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="3" stroke="#5A7D4E" strokeWidth="2" fill="none"/><line x1="3" y1="9" x2="21" y2="9" stroke="#5A7D4E" strokeWidth="1.5"/></svg>
                <span style={{fontFamily:"'Playfair Display',serif",fontSize:14,color:"#3D2E1F",fontWeight:600}}>Inplannen</span>
                <span style={{fontSize:11,color:"#A89B8A",fontFamily:"'DM Sans',sans-serif",marginLeft:"auto"}}>Selecteer dag(en)</span>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                {_mts.map(mt=><button key={mt.id} onClick={()=>setSelectedMealType(mt.id)} style={{flex:1,padding:"7px 6px",borderRadius:10,border:selectedMealType===mt.id?"2px solid #6B8F5E":"1.5px solid #E2DAD0",background:selectedMealType===mt.id?"#6B8F5E10":"transparent",color:selectedMealType===mt.id?"#5A7D4E":"#8C7E6F",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer",transition:"all 0.15s",display:"flex",alignItems:"center",justifyContent:"center",gap:4}}>{mt.e} {mt.l}</button>)}
              </div>
              <p style={{fontSize:10,color:"#A89B8A",fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px",fontWeight:600}}>Deze week</p>
              <div style={{display:"flex",gap:4,marginBottom:8}}>{_wk.map(d=>renderDay(d, _isP(d)&&!_isT(d)))}</div>
              <p style={{fontSize:10,color:"#A89B8A",fontFamily:"'DM Sans',sans-serif",margin:"0 0 4px",fontWeight:600}}>Volgende week</p>
              <div style={{display:"flex",gap:4,marginBottom:12}}>{_nWk.map(d=>renderDay(d, false))}</div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={async()=>{if(!selectedDays.length)return;setPlannerStatus("Inplannen...");await onAddToPlanner(recipe.id,selectedDays,selectedMealType);setPlannerStatus("Ingepland voor "+selectedDays.length+" dag"+(selectedDays.length>1?"en":"")+"!");setTimeout(()=>{setShowPlannerPicker(false);setPlannerStatus("");},1500);}} disabled={!selectedDays.length} style={{flex:1,padding:"10px",borderRadius:10,border:"none",background:selectedDays.length?"linear-gradient(135deg,#6B8F5E,#5A7D4E)":"#E2DAD0",color:selectedDays.length?"#fff":"#A89B8A",fontSize:13,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:selectedDays.length?"pointer":"default",transition:"all 0.2s"}}>
                  {plannerStatus||(selectedDays.length===0?"Selecteer dag(en)":"Inplannen ("+selectedDays.length+" dag"+(selectedDays.length>1?"en":"")+")")}
                </button>
                <button onClick={()=>setShowPlannerPicker(false)} style={{padding:"10px 14px",borderRadius:10,border:"1.5px solid #E2DAD0",background:"transparent",color:"#8C7E6F",fontSize:12,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"}}>Annuleer</button>
              </div>
            </div>
          );
        })()}

        {expanded && (
          <div style={{ marginTop: 16, animation: "fadeIn 0.3s ease" }}>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr", gap: 16,
            }}>
              {/* Ingredients column */}
              <div style={{
                background: "#FAF7F2", borderRadius: 14, padding: 16,
                border: "1px solid #EDE8E0",
              }}>
                <h4 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#3D2E1F",
                  margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6,
                }}>🥘 Ingrediënten</h4>
                <ul style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: "#6B5D4F",
                  lineHeight: 2, paddingLeft: 18, margin: 0, listStyleType: "'• '",
                }}>
                  {recipe.ingredients?.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
              </div>
              {/* Steps column */}
              <div style={{
                background: "#FAF7F2", borderRadius: 14, padding: 16,
                border: "1px solid #EDE8E0",
              }}>
                <h4 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#3D2E1F",
                  margin: "0 0 12px", display: "flex", alignItems: "center", gap: 6,
                }}>👩‍🍳 Bereiding</h4>
                <ol style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: "#6B5D4F",
                  lineHeight: 1.8, paddingLeft: 20, margin: 0,
                }}>
                  {recipe.steps?.map((step, i) => (
                    <li key={i} style={{ marginBottom: 8, paddingLeft: 4 }}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
            {recipe.tips && (
              <div style={{
                marginTop: 12, background: "linear-gradient(135deg, #FFF8E7, #FFF3D6)",
                borderRadius: 12, padding: "12px 16px", border: "1px solid #F0E4C8",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>💡</span>
                <div>
                  <span style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700,
                    color: "#B8860B", textTransform: "uppercase", letterSpacing: 0.5,
                  }}>Tip</span>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, color: "#6B5D4F",
                    lineHeight: 1.6, margin: "4px 0 0",
                  }}>{recipe.tips}</p>
                </div>
              </div>
            )}

            {/* Share button */}
            {recipe.isOwn && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setShowShare(!showShare)}
                  style={{
                    width: "100%", padding: "10px 16px", borderRadius: 12,
                    border: "1.5px solid #D5CEC4", background: showShare ? "#8B6F4708" : "transparent",
                    color: "#8B6F47", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  📤 Deel dit recept
                </button>
                {showShare && (
                  <div style={{
                    marginTop: 8, display: "flex", gap: 8, animation: "fadeIn 0.2s ease",
                  }}>
                    <input type="email" value={shareEmail}
                      onChange={(e) => setShareEmail(e.target.value)}
                      placeholder="E-mail van ontvanger..."
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: 10,
                        border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                        outline: "none",
                      }}
                    />
                    <button onClick={async () => {
                      if (!shareEmail.trim()) return;
                      setShareStatus("");
                      const result = await onShare(recipe.id, shareEmail.trim());
                      setShareStatus(result);
                      if (result === "Recept gedeeld!") setShareEmail("");
                    }}
                      style={{
                        padding: "10px 18px", borderRadius: 10, border: "none",
                        background: "linear-gradient(135deg, #D4A574, #C09060)",
                        color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
                      }}>Deel</button>
                  </div>
                )}
                {shareStatus && (
                  <p style={{
                    fontSize: 12, margin: "6px 0 0",
                    color: shareStatus === "Recept gedeeld!" ? "#6B8F5E" : "#C85A3D",
                    fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                  }}>{shareStatus}</p>
                )}
              </div>
            )}

            {/* Gekookt button */}
            <button onClick={() => onMarkCooked?.(recipe.id)}
              style={{
                marginTop: 12, width: "100%", padding: "12px 16px", borderRadius: 12,
                border: "1.5px solid #6B8F5E", background: "#6B8F5E10",
                color: "#6B8F5E", fontFamily: "'DM Sans', sans-serif", fontSize: 14,
                fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 8, transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#6B8F5E"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#6B8F5E10"; e.currentTarget.style.color = "#6B8F5E"; }}
            >✅ Gekookt!</button>

            {/* Collection picker */}
            {collections && collections.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <button onClick={() => setShowCollectionPicker(!showCollectionPicker)}
                  style={{
                    width: "100%", padding: "10px 16px", borderRadius: 12,
                    border: "1.5px solid #D5CEC4", background: showCollectionPicker ? "#8B6F4708" : "transparent",
                    color: "#8B6F47", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  📂 {showCollectionPicker ? "Sluit collecties" : "Toevoegen aan collectie"}
                </button>
                {showCollectionPicker && (
                  <div style={{
                    marginTop: 8, display: "flex", flexDirection: "column", gap: 6,
                    animation: "fadeIn 0.2s ease",
                  }}>
                    {collections.map(col => {
                      const isInCol = col.recipeIds?.includes(recipe.id);
                      return (
                        <button key={col.id}
                          onClick={() => isInCol
                            ? onRemoveFromCollection?.(col.id, recipe.id)
                            : onAddToCollection?.(col.id, recipe.id)
                          }
                          style={{
                            padding: "10px 14px", borderRadius: 10,
                            border: isInCol ? "2px solid #6B8F5E" : "1.5px solid #E2DAD0",
                            background: isInCol ? "#6B8F5E10" : "#FAF7F2",
                            color: isInCol ? "#6B8F5E" : "#3D2E1F",
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                            fontWeight: isInCol ? 600 : 400, cursor: "pointer",
                            textAlign: "left", transition: "all 0.2s",
                            display: "flex", alignItems: "center", gap: 8,
                          }}
                        >
                          <span>{isInCol ? "✓" : "+"}</span>
                          {col.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main App ─── */

export default function RecipeApp({ session }) {
  const user = session.user;
  const [recipes, setRecipes] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storageLoading, setStorageLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("recepten");
  const [prompt, setPrompt] = useState("");
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [usePantry, setUsePantry] = useState(false);
  const [filterFav, setFilterFav] = useState(false);
  const [filterTag, setFilterTag] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState("");
  const [genStatus, setGenStatus] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [choosingRecipe, setChoosingRecipe] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [pexelsImages, setPexelsImages] = useState({});
  const [showImportUrl, setShowImportUrl] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [recipesRes, pantryRes, profileRes, sharedRes, collectionsRes] = await Promise.all([
          supabase.from("recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("pantry_items").select("*").eq("user_id", user.id),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("shared_recipes").select("recipe_id, recipes(*)").eq("shared_with", user.id),
          supabase.from("recipe_collections").select("*, recipe_collection_items(recipe_id)").eq("user_id", user.id).order("created_at", { ascending: false }),
        ]);
        if (recipesRes.data) {
          const ownRecipes = recipesRes.data.map(r => ({
            id: r.id, title: r.title, description: r.description, cuisine: r.cuisine,
            prepTime: r.prep_time, servings: r.servings, ingredients: r.ingredients,
            steps: r.steps, tips: r.tips, addedBy: r.added_by,
            favorite: r.favorite, rating: r.rating, tags: r.tags,
            usedPantry: r.used_pantry, createdAt: r.created_at, lastCookedAt: r.last_cooked_at, isOwn: true,
          }));
          const sharedRecipes = (sharedRes.data || [])
            .filter(s => s.recipes)
            .map(s => ({
              id: s.recipes.id, title: s.recipes.title, description: s.recipes.description,
              cuisine: s.recipes.cuisine, prepTime: s.recipes.prep_time, servings: s.recipes.servings,
              ingredients: s.recipes.ingredients, steps: s.recipes.steps, tips: s.recipes.tips,
              addedBy: s.recipes.added_by, favorite: s.recipes.favorite, rating: s.recipes.rating,
              tags: s.recipes.tags, usedPantry: s.recipes.used_pantry, createdAt: s.recipes.created_at,
              lastCookedAt: s.recipes.last_cooked_at, isShared: true,
            }));
          setRecipes([...ownRecipes, ...sharedRecipes]);
        }
        if (pantryRes.data) setPantry(pantryRes.data.map(p => ({ id: p.id, name: p.name, category: p.category, quantity: p.quantity })));
        if (profileRes.data) setProfile(profileRes.data);
        if (collectionsRes.data) setCollections(collectionsRes.data.map(c => ({
          id: c.id, name: c.name, createdAt: c.created_at,
          recipeIds: (c.recipe_collection_items || []).map(i => i.recipe_id),
        })));
      } catch (e) { console.log("Loading:", e); }
      setStorageLoading(false);
    })();
  }, [user.id]);

  const saveRecipe = useCallback(async (recipe) => {
    const { data, error } = await supabase.from("recipes").upsert({
      id: recipe.id, user_id: user.id, title: recipe.title, description: recipe.description,
      cuisine: recipe.cuisine, prep_time: recipe.prepTime, servings: recipe.servings,
      ingredients: recipe.ingredients, steps: recipe.steps, tips: recipe.tips,
      added_by: recipe.addedBy, favorite: recipe.favorite, rating: recipe.rating,
      tags: recipe.tags, used_pantry: recipe.usedPantry,
    }).select().single();
    return data;
  }, [user.id]);

  const updateRecipeField = useCallback(async (id, updates) => {
    const dbUpdates = {};
    if ("favorite" in updates) dbUpdates.favorite = updates.favorite;
    if ("rating" in updates) dbUpdates.rating = updates.rating;
    if ("tags" in updates) dbUpdates.tags = updates.tags;
    if ("lastCookedAt" in updates) dbUpdates.last_cooked_at = updates.lastCookedAt;
    await supabase.from("recipes").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, [user.id]);

  const markAsCooked = (id) => {
    updateRecipeField(id, { lastCookedAt: new Date().toISOString() });
  };

  const createCollection = async (name) => {
    const { data } = await supabase.from("recipe_collections").insert({
      user_id: user.id, name,
    }).select().single();
    if (data) setCollections(prev => [{ id: data.id, name: data.name, createdAt: data.created_at, recipeIds: [] }, ...prev]);
    setNewCollectionName("");
    setShowCreateCollection(false);
  };

  const deleteCollection = async (collectionId) => {
    await supabase.from("recipe_collection_items").delete().eq("collection_id", collectionId);
    await supabase.from("recipe_collections").delete().eq("id", collectionId).eq("user_id", user.id);
    setCollections(prev => prev.filter(c => c.id !== collectionId));
    if (selectedCollection === collectionId) setSelectedCollection(null);
  };

  const addToCollection = async (collectionId, recipeId) => {
    const col = collections.find(c => c.id === collectionId);
    if (col?.recipeIds?.includes(recipeId)) return;
    await supabase.from("recipe_collection_items").insert({ collection_id: collectionId, recipe_id: recipeId });
    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, recipeIds: [...c.recipeIds, recipeId] } : c));
  };

  const removeFromCollection = async (collectionId, recipeId) => {
    await supabase.from("recipe_collection_items").delete().eq("collection_id", collectionId).eq("recipe_id", recipeId);
    setCollections(prev => prev.map(c => c.id === collectionId ? { ...c, recipeIds: c.recipeIds.filter(id => id !== recipeId) } : c));
  };

  const importFromUrl = async () => {
    if (!importUrl.trim()) return;
    setImportLoading(true); setError("");
    try {
      const servings = profile?.household_size || 2;
      const data = await geminiCall({
        contents: [{ parts: [{ text: `Je bent een creatieve Nederlandse chef-kok. De gebruiker wil een recept importeren van deze URL: ${importUrl}. Genereer een volledig recept in het Nederlands op basis van wat je weet over dit type gerecht/website. Maak het voor ${servings} personen.${profile?.allergies?.length ? ` BELANGRIJK - Allergie\u00EBn (gebruik deze ingredi\u00EBnten NOOIT): ${profile.allergies.join(", ")}` : ""}${profile?.dislikes?.length ? ` Vermijd: ${profile.dislikes.join(", ")}` : ""}
Antwoord ALLEEN met valid JSON in dit exacte formaat, zonder markdown of backticks:
{"title":"naam","description":"korte beschrijving in 1 zin","cuisine":"type keuken","prepTime":"bereidingstijd","servings":${servings},"ingredients":["ingredi\u00EBnt 1","ingredi\u00EBnt 2"],"steps":["stap 1","stap 2"],"tips":"optionele tip"}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
      });
      if (data.error) throw new Error(data.error.message || "API fout");
      const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      const newRecipe = {
        ...parsed, addedBy: profile?.display_name || user.email,
        favorite: false, rating: 0, tags: [],
        createdAt: new Date().toISOString(),
      };
      const saved = await saveRecipe(newRecipe);
      if (saved) {
        setRecipes(prev => [{ ...newRecipe, id: saved.id, isOwn: true }, ...prev]);
      }
      setImportUrl(""); setShowImportUrl(false);
    } catch (err) {
      setError("Import mislukt: " + (err.message || "Er ging iets mis."));
    }
    setImportLoading(false);
  };

  const addPantryItem = async (item) => {
    const { data } = await supabase.from("pantry_items").insert({
      user_id: user.id, name: item.name, category: item.category, quantity: item.quantity,
    }).select().single();
    if (data) setPantry(prev => [...prev, { id: data.id, name: data.name, category: data.category, quantity: data.quantity }]);
  };

  const addPantryItems = async (items) => {
    const rows = items.map(i => ({ user_id: user.id, name: i.name, category: i.category, quantity: i.quantity }));
    const { data } = await supabase.from("pantry_items").insert(rows).select();
    if (data) setPantry(prev => [...prev, ...data.map(p => ({ id: p.id, name: p.name, category: p.category, quantity: p.quantity }))]);
  };

  const removePantryItem = async (id) => {
    await supabase.from("pantry_items").delete().eq("id", id).eq("user_id", user.id);
    setPantry(prev => prev.filter(p => p.id !== id));
  };

  const clearPantry = async () => {
    await supabase.from("pantry_items").delete().eq("user_id", user.id);
    setPantry([]);
  };

  const shareRecipe = async (recipeId, email) => {
    const { data: targetUserId, error: rpcError } = await supabase.rpc("get_user_id_by_email", { email_input: email });
    if (rpcError || !targetUserId) {
      return "Gebruiker niet gevonden. Controleer het e-mailadres.";
    }
    if (targetUserId === user.id) {
      return "Je kunt niet met jezelf delen!";
    }
    const { error } = await supabase.from("shared_recipes").insert({
      recipe_id: recipeId, shared_by: user.id, shared_with: targetUserId,
    });
    if (error) {
      return error.code === "23505" ? "Al gedeeld met deze gebruiker!" : "Fout bij delen.";
    }
    return "Recept gedeeld!";
  };

  const buildUserPrompt = () => {
    const servings = profile?.household_size || 2;
    let userPrompt = `Voor ${servings} personen.\n`;
    if (prompt.trim()) userPrompt += `Verzoek: ${prompt}\n`;
    if (selectedCuisines.length) userPrompt += `Keuken: ${selectedCuisines.join(", ")}\n`;
    if (selectedDiets.length) userPrompt += `Dieet: ${selectedDiets.join(", ")}\n`;
    else if (profile?.dietary_preferences?.length) userPrompt += `Dieet: ${profile.dietary_preferences.join(", ")}\n`;
    if (selectedTime) userPrompt += `Bereidingstijd: ${selectedTime}\n`;
    if (profile?.allergies?.length) userPrompt += `BELANGRIJK - Allergieën (gebruik deze ingrediënten NOOIT): ${profile.allergies.join(", ")}\n`;
    if (profile?.dislikes?.length) userPrompt += `Vermijd deze ingrediënten (gebruiker lust dit niet): ${profile.dislikes.join(", ")}\n`;
    if (profile?.cooking_level === "beginner") userPrompt += `Houd het recept simpel en beginner-vriendelijk.\n`;
    if (usePantry && pantry.length > 0)
      userPrompt += `\nBelangrijk: Gebruik zoveel mogelijk deze producten die we in huis hebben: ${pantry.map(p => p.name).join(", ")}. Extra ingrediënten mogen als nodig.\n`;
    return userPrompt;
  };

  const generateRecipe = async () => {
    if (!prompt.trim() && selectedCuisines.length === 0 && !(usePantry && pantry.length > 0)) {
      setError("Voer een beschrijving in, kies een keuken, of gebruik de voorraadkast!");
      return;
    }
    setError(""); setLoading(true); setSuggestions([]);
    setGenStatus("Receptideeën bedenken...");

    const userPrompt = buildUserPrompt();
    const servings = profile?.household_size || 2;

    try {
      const data = await geminiCall({
        contents: [{ parts: [{ text: `Je bent een creatieve Nederlandse chef-kok. Bedenk 5 VERSCHILLENDE receptideeën in het Nederlands op basis van de wensen. Zorg voor variatie in keuken, bereidingswijze en smaakprofiel. Als er allergieën of dislikes zijn opgegeven, gebruik die ingrediënten NOOIT. Antwoord ALLEEN met valid JSON in dit exacte formaat, zonder markdown of backticks:
[{"title":"naam gerecht","description":"korte appetijt-opwekkende beschrijving in 1 zin","cuisine":"type keuken","prepTime":"bereidingstijd","imageQuery":"very specific english photo search term"},{"title":"..."},...]
Geef precies 5 items. BELANGRIJK voor imageQuery: dit wordt gebruikt om een foto te zoeken op Pexels. Gebruik de EXACTE Engelse naam van het gerecht zoals het er op een bord uitziet. Voorbeelden: "stamppot mashed potatoes with sausage dutch", "smash burger with melted cheese", "greek gyros pita wrap", "pad thai noodles shrimp". Wees zo specifiek mogelijk over hoe het gerecht eruitziet, niet alleen de naam.

Gebruikerswensen:
${userPrompt}` }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 8192, responseMimeType: "application/json" },
      });
      if (data.error) throw new Error(data.error.message || "API fout");
      const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Geen suggesties ontvangen");
      const items = parsed.slice(0, 5);
      setSuggestions(items);
      setSelectedSuggestions([]);
      setChoosingRecipe(true);
      setGenStatus("");
      // Load Pexels images in background
      items.forEach(async (s, i) => {
        try {
          const q = s.imageQuery || s.title;
          const pexelsKey = import.meta.env.VITE_PEXELS_API_KEY;
          let imgUrl = null;
          if (pexelsKey) {
            const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=3&orientation=landscape`, { headers: { Authorization: pexelsKey } });
            const d = await r.json();
            imgUrl = d.photos?.[0]?.src?.large || d.photos?.[0]?.src?.medium || null;
          } else {
            const r = await fetch(`/api/pexels?q=${encodeURIComponent(q)}`);
            const d = await r.json();
            imgUrl = d.url || null;
          }
          if (imgUrl) setPexelsImages(prev => ({ ...prev, [i]: imgUrl }));
        } catch {}
      });
    } catch (err) {
      setError("Oeps! " + (err.message || "Er ging iets mis.")); setGenStatus("");
    }
    setLoading(false);
  };

  const toggleSuggestion = (i) => {
    setSelectedSuggestions(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  };

  const processSelectedSuggestions = async () => {
    const picks = selectedSuggestions.map(i => suggestions[i]);
    if (picks.length === 0) return;

    setLoading(true); setChoosingRecipe(false);
    const servings = profile?.household_size || 2;
    const userPrompt = buildUserPrompt();
    const savedRecipes = [];

    for (let idx = 0; idx < picks.length; idx++) {
      const suggestion = picks[idx];
      setGenStatus(`Recept ${idx + 1}/${picks.length} uitwerken: ${suggestion.title}...`);

      try {
        const data = await geminiCall({
          contents: [{ parts: [{ text: `Je bent een creatieve Nederlandse chef-kok. Werk het gegeven receptidee uit tot een volledig recept in het Nederlands, voor ${servings} personen. Als er allergieën of dislikes zijn opgegeven, gebruik die ingrediënten NOOIT. Als er producten worden meegegeven die de gebruiker in huis heeft, maak daar creatief gebruik van. Antwoord ALLEEN met valid JSON in dit exacte formaat, zonder markdown of backticks:
{"title":"naam","description":"korte beschrijving in 1 zin","cuisine":"type keuken","prepTime":"bereidingstijd","servings":${servings},"ingredients":["ingrediënt 1","ingrediënt 2"],"steps":["stap 1","stap 2"],"tips":"optionele tip"}

Werk dit receptidee uit:
Gerecht: ${suggestion.title}
Beschrijving: ${suggestion.description}
Keuken: ${suggestion.cuisine}

Context van de gebruiker:
${userPrompt}` }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192, responseMimeType: "application/json" },
        });
        if (data.error) throw new Error(data.error.message || "API fout");
        const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

        const newRecipe = {
          ...parsed, addedBy: profile?.display_name || user.email,
          favorite: false, rating: 0, tags: [],
          usedPantry: usePantry && pantry.length > 0,
          createdAt: new Date().toISOString(),
        };
        const saved = await saveRecipe(newRecipe);
        if (saved) {
          const fullRecipe = { ...newRecipe, id: saved.id, isOwn: true };
          setRecipes(prev => [fullRecipe, ...prev]);
          savedRecipes.push(fullRecipe);
        }
      } catch (err) {
        setError(`Fout bij "${suggestion.title}": ${err.message || "Er ging iets mis."}`);
      }
    }

    setPrompt(""); setSelectedCuisines([]); setSelectedDiets([]); setSelectedTime("");
    setUsePantry(false); setSuggestions([]); setSelectedSuggestions([]);
    setPexelsImages({}); setGenStatus(""); setWizardStep(0);
    setLoading(false);

    // Navigate to weekplanner if multiple recipes were saved
    if (savedRecipes.length > 1) {
      setActiveTab("weekplanner");
    }
  };

  const toggleFav = (id) => {
    const recipe = recipes.find(r => r.id === id);
    if (recipe) updateRecipeField(id, { favorite: !recipe.favorite });
  };
  const rateRecipe = (id, rating) => updateRecipeField(id, { rating });
  const deleteRecipe = async (id) => {
    await supabase.from("recipes").delete().eq("id", id).eq("user_id", user.id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  };
  const addToPlanner = async (recipeId, dates, mealType) => {
    const promises = dates.map(date =>
      supabase.from("meal_plans").upsert({
        user_id: user.id,
        date: date,
        meal_type: mealType,
        recipe_id: recipeId,
        custom_meal: null,
      }, { onConflict: "user_id,date,meal_type" })
    );
    await Promise.all(promises);
  };

  const toggleTag = (id, tag) => {
    const recipe = recipes.find(r => r.id === id);
    if (!recipe) return;
    const tags = recipe.tags || [];
    const newTags = tags.includes(tag) ? tags.filter(t => t !== tag) : [...tags, tag];
    updateRecipeField(id, { tags: newTags });
  };
  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);

  const filtered = recipes.filter(r => {
    if (filterFav && !r.favorite) return false;
    if (filterTag && !r.tags?.includes(filterTag)) return false;
    if (filterUser && r.addedBy !== filterUser) return false;
    if (selectedCollection) {
      const col = collections.find(c => c.id === selectedCollection);
      if (col && !col.recipeIds.includes(r.id)) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === "langst-niet-gekookt") {
      const aTime = a.lastCookedAt ? new Date(a.lastCookedAt).getTime() : 0;
      const bTime = b.lastCookedAt ? new Date(b.lastCookedAt).getTime() : 0;
      return aTime - bTime;
    }
    return 0;
  });

  const favCount = recipes.filter(r => r.favorite).length;

  if (storageLoading) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #F5EDE3 0%, #EDE3D5 100%)",
        fontFamily: "'Playfair Display', serif", color: "#8B6F47", fontSize: 22
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontSize: 48, marginBottom: 16,
            animation: "spin-pan 1.2s ease-in-out infinite",
            display: "inline-block"
          }}>🍳</div>
          <style>{`
            @keyframes spin-pan {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div>Laden...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(165deg, #F5EDE3 0%, #EDE3D5 50%, #E8DFD1 100%)",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes scanLine { 0% { top: 0; } 50% { top: 100%; } 100% { top: 0; } }
        * { box-sizing: border-box; }
        textarea:focus, input:focus { outline: none; border-color: #8B6F47 !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #C5BAA8; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        backgroundImage: "linear-gradient(to bottom, rgba(44,24,16,0.72) 0%, rgba(74,50,40,0.82) 50%, rgba(44,24,16,0.92) 100%), url('/images/hero-cooking.webp')",
        backgroundSize: "cover", backgroundPosition: "center 40%",
        padding: "36px 24px 28px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
          {/* Logo + subtitel gecentreerd */}
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img src="/images/logo.webp" alt="Onze Recepten"
              style={{
                width: 180, height: "auto", display: "block", margin: "0 auto 4px",
                filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
              }}
            />
            <p style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(197,186,168,0.7)",
              margin: "6px 0 0", letterSpacing: 0.5,
            }}>Je persoonlijke culinaire verzameling</p>
          </div>

          {/* Logged in user */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 22 }}>
            <div style={{
              padding: "10px 24px", borderRadius: 28,
              background: "linear-gradient(135deg, #D4A574, #C09060)",
              color: "#fff", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14,
              boxShadow: "0 4px 16px rgba(212,165,116,0.3)",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700,
              }}>{(profile?.display_name || user.email).charAt(0).toUpperCase()}</span>
              {profile?.display_name || user.email}
            </div>
          </div>

          {/* Stats gecentreerd */}
          <div style={{
            display: "flex", justifyContent: "center", gap: 32,
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "rgba(197,186,168,0.8)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#F5EDE3", lineHeight: 1 }}>{recipes.length}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>recepten</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.12)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#F5EDE3", lineHeight: 1 }}>{favCount}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>favorieten</div>
            </div>
            <div style={{ width: 1, background: "rgba(255,255,255,0.12)", alignSelf: "stretch" }} />
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#F5EDE3", lineHeight: 1 }}>{pantry.length}</div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>voorraad</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: "0 auto", padding: "24px 16px 110px" }}>

        {activeTab === "voorraad" && (
          <PantrySection pantry={pantry} onAdd={addPantryItem} onAddMultiple={addPantryItems}
            onRemove={removePantryItem} onClear={clearPantry} />
        )}

        {activeTab === "profiel" && (
          <ProfilePage user={user} profile={profile} onProfileUpdate={(updated) => setProfile(prev => ({ ...prev, ...updated }))} />
        )}

        {activeTab === "weekplanner" && (
          <WeekPlanner user={user} recipes={recipes} pantry={pantry}
            preferredSupermarket={profile?.preferred_supermarket || ""}
            onNavigateToRecipes={(p) => { setPrompt(p); setActiveTab("recepten"); }} />
        )}

        {activeTab === "recepten" && (
          <>
            {/* Generator - Wizard */}
            <div style={{
              background: "#FFFCF7", borderRadius: 24, padding: "28px 24px 22px",
              boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 24,
              border: "1px solid #EDE8E0", position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: -10, right: -10, fontSize: 80, opacity: 0.05,
                transform: "rotate(20deg)", pointerEvents: "none",
              }}>✨</div>

              {/* Wizard header with progress */}
              <div style={{ position: "relative", marginBottom: 20 }}>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#3D2E1F",
                  margin: "0 0 14px", display: "flex", alignItems: "center", gap: 10,
                }}>
                  <span style={{
                    background: "linear-gradient(135deg, #D4A574, #C09060)",
                    borderRadius: 12, padding: "6px 10px", fontSize: 20,
                  }}>✨</span>
                  {choosingRecipe ? "Kies je gerecht" : loading ? "Even geduld..." : wizardStep === 0 ? "Wat wil je eten?" : wizardStep === 1 ? "Verfijn je keuze" : "Bijna klaar!"}
                </h2>
                {/* Progress dots */}
                {!choosingRecipe && !loading && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {[0, 1, 2].map(s => (
                      <button key={s} onClick={() => s <= wizardStep && setWizardStep(s)}
                        style={{
                          width: s === wizardStep ? 24 : 8, height: 8, borderRadius: 4, border: "none",
                          background: s <= wizardStep ? "linear-gradient(135deg, #D4A574, #C09060)" : "#E2DAD0",
                          cursor: s <= wizardStep ? "pointer" : "default",
                          transition: "all 0.3s ease",
                        }}
                      />
                    ))}
                    <span style={{ fontSize: 11, color: "#B5A999", marginLeft: 6, fontFamily: "'DM Sans', sans-serif" }}>
                      Stap {wizardStep + 1} van 3
                    </span>
                  </div>
                )}
              </div>

              {/* STEP 0: Inspiratie & prompt */}
              {wizardStep === 0 && !choosingRecipe && !loading && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {/* Quick inspiration cards */}
                  {(() => {
                    const hour = new Date().getHours();
                    const mealSuggestion = hour < 10 ? "Ontbijt" : hour < 14 ? "Lunch" : hour < 17 ? "Tussendoortje" : "Diner";
                    const mealEmoji = hour < 10 ? "🥐" : hour < 14 ? "🥗" : hour < 17 ? "🍪" : "🍽️";
                    const quickPicks = [
                      { label: mealSuggestion, emoji: mealEmoji, prompt: `Een lekker ${mealSuggestion.toLowerCase()} gerecht`, sub: "Past bij dit moment" },
                      { label: "Iets snels", emoji: "⚡", prompt: "Een snel en makkelijk gerecht onder 15 minuten", sub: "Klaar in 15 min" },
                      { label: "Comfort food", emoji: "🫕", prompt: "Een lekker comfort food gerecht, hartig en warm", sub: "Hartig & warm" },
                      { label: "Gezond", emoji: "🥦", prompt: "Een gezond en voedzaam gerecht met veel groenten", sub: "Vol groenten" },
                      { label: "Budget", emoji: "💰", prompt: "Een lekker maar goedkoop gerecht met simpele ingrediënten", sub: "Simpele ingrediënten" },
                      { label: "Verrassend", emoji: "🎲", prompt: "Verras me met een onverwacht maar lekker gerecht", sub: "Laat je verrassen" },
                    ];
                    return (
                      <div style={{ marginBottom: 16 }}>
                        <p style={{ fontSize: 12, color: "#A89B8A", margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                          Snelle inspiratie
                        </p>
                        <div style={{
                          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
                        }}>
                          {quickPicks.map((pick) => (
                            <button key={pick.label} onClick={() => { setPrompt(pick.prompt); setWizardStep(1); }}
                              style={{
                                padding: "14px 10px", borderRadius: 14,
                                border: prompt === pick.prompt ? "2px solid #8B6F47" : "1.5px solid #EDE8E0",
                                background: prompt === pick.prompt ? "#8B6F4710" : "#FAF7F2",
                                cursor: "pointer", transition: "all 0.2s",
                                display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                                textAlign: "center",
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D4A574"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = prompt === pick.prompt ? "#8B6F47" : "#EDE8E0"; e.currentTarget.style.transform = "translateY(0)"; }}
                            >
                              <span style={{ fontSize: 24 }}>{pick.emoji}</span>
                              <span style={{ fontSize: 12.5, fontWeight: 600, color: "#3D2E1F", fontFamily: "'DM Sans', sans-serif" }}>{pick.label}</span>
                              <span style={{ fontSize: 10.5, color: "#A89B8A", fontFamily: "'DM Sans', sans-serif" }}>{pick.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Divider */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 14px" }}>
                    <div style={{ flex: 1, height: 1, background: "#EDE8E0" }} />
                    <span style={{ fontSize: 11, color: "#B5A999", fontFamily: "'DM Sans', sans-serif" }}>of typ zelf</span>
                    <div style={{ flex: 1, height: 1, background: "#EDE8E0" }} />
                  </div>

                  {/* URL Import */}
                  <div style={{ marginBottom: 14 }}>
                    <button onClick={() => setShowImportUrl(!showImportUrl)}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: 12,
                        border: showImportUrl ? "2px solid #8B6F47" : "1.5px dashed #D5CEC4",
                        background: showImportUrl ? "#8B6F4708" : "transparent",
                        color: "#8B6F47", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        fontWeight: 600, cursor: "pointer", transition: "all 0.2s",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      }}>
                      🔗 Importeer recept van URL
                    </button>
                    {showImportUrl && (
                      <div style={{ marginTop: 10, animation: "fadeIn 0.2s ease" }}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <input type="url" value={importUrl}
                            onChange={(e) => setImportUrl(e.target.value)}
                            placeholder="https://www.voorbeeld.nl/recept..."
                            style={{
                              flex: 1, padding: "10px 14px", borderRadius: 10,
                              border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") importFromUrl(); }}
                          />
                          <button onClick={importFromUrl}
                            disabled={importLoading || !importUrl.trim()}
                            style={{
                              padding: "10px 18px", borderRadius: 10, border: "none",
                              background: importUrl.trim() && !importLoading
                                ? "linear-gradient(135deg, #D4A574, #C09060)" : "#EDE8E0",
                              color: importUrl.trim() && !importLoading ? "#fff" : "#B5A999",
                              fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                              fontWeight: 600, cursor: importUrl.trim() && !importLoading ? "pointer" : "default",
                              whiteSpace: "nowrap",
                            }}>
                            {importLoading ? "Bezig..." : "Importeer"}
                          </button>
                        </div>
                        <p style={{
                          fontSize: 11, color: "#B5A999", margin: "6px 0 0",
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          AI genereert een recept op basis van de URL
                        </p>
                      </div>
                    )}
                  </div>

                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Beschrijf wat je wilt eten..."
                    rows={2}
                    style={{
                      width: "100%", padding: "14px 16px", borderRadius: 14,
                      border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#3D2E1F",
                      resize: "none", lineHeight: 1.5,
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) generateRecipe(); }}
                  />

                  {/* Next / Skip to generate */}
                  <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                    <button onClick={() => setWizardStep(1)}
                      disabled={!prompt.trim()}
                      style={{
                        flex: 1, padding: "14px", borderRadius: 12, border: "none",
                        background: prompt.trim() ? "linear-gradient(135deg, #D4A574, #C09060)" : "#EDE8E0",
                        color: prompt.trim() ? "#fff" : "#B5A999",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                        cursor: prompt.trim() ? "pointer" : "default", transition: "all 0.3s",
                      }}
                    >Volgende →</button>
                    <button onClick={() => { setWizardStep(2); }}
                      style={{
                        padding: "14px 18px", borderRadius: 12,
                        border: "1.5px solid #E2DAD0", background: "transparent",
                        color: "#8C7E6F", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                      }}
                    >Sla over</button>
                  </div>
                </div>
              )}

              {/* STEP 1: Keuken & voorkeuren */}
              {wizardStep === 1 && !choosingRecipe && !loading && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  {/* Cuisine as visual mini-cards */}
                  <p style={{ fontSize: 12, color: "#A89B8A", margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    Kies een keuken (optioneel)
                  </p>
                  <div style={{
                    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 18,
                  }}>
                    {CUISINES.map(c => {
                      const vis = CUISINE_VISUALS[c] || DEFAULT_VISUAL;
                      const active = selectedCuisines.includes(c);
                      return (
                        <button key={c} onClick={() => toggle(selectedCuisines, setSelectedCuisines, c)}
                          style={{
                            padding: "10px 4px", borderRadius: 12,
                            border: active ? "2px solid #8B6F47" : "1.5px solid #EDE8E0",
                            background: active ? vis.gradient : "#FAF7F2",
                            cursor: "pointer", transition: "all 0.2s",
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                          }}
                        >
                          <span style={{ fontSize: 20, filter: active ? "brightness(10)" : "none" }}>{vis.emoji}</span>
                          <span style={{
                            fontSize: 10.5, fontWeight: active ? 600 : 400,
                            color: active ? "#fff" : "#6B5D4F",
                            fontFamily: "'DM Sans', sans-serif",
                          }}>{c}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Diet pills */}
                  <p style={{ fontSize: 12, color: "#A89B8A", margin: "0 0 8px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    Dieetwensen (optioneel)
                  </p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                    {DIETS.map(d => <TagPill key={d} label={d} active={selectedDiets.includes(d)} onClick={() => toggle(selectedDiets, setSelectedDiets, d)} color="#6B8F5E" />)}
                  </div>

                  {/* Pantry toggle */}
                  {pantry.length > 0 && (
                    <button onClick={() => setUsePantry(!usePantry)}
                      style={{
                        marginBottom: 16, padding: "12px 16px", borderRadius: 14, width: "100%",
                        border: usePantry ? "2px solid #6B8F5E" : "1.5px solid #EDE8E0",
                        background: usePantry ? "linear-gradient(135deg, #6B8F5E10, #6B8F5E08)" : "#FAF7F2",
                        color: usePantry ? "#5A7D4E" : "#8C7E6F",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, fontWeight: 500,
                        cursor: "pointer", transition: "all 0.25s", textAlign: "left",
                        display: "flex", alignItems: "center", gap: 10,
                      }}
                    >
                      <span style={{
                        width: 26, height: 26, borderRadius: 8, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 15,
                        background: usePantry ? "#6B8F5E" : "#EDE8E0",
                        color: usePantry ? "#fff" : "#B5A999", transition: "all 0.25s", flexShrink: 0,
                      }}>{usePantry ? "✓" : "🧊"}</span>
                      <span>
                        Kook met onze voorraad
                        <span style={{ fontSize: 11.5, opacity: 0.7, display: "block", marginTop: 1 }}>
                          {pantry.length} product{pantry.length !== 1 ? "en" : ""} beschikbaar
                        </span>
                      </span>
                    </button>
                  )}

                  {/* Nav buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setWizardStep(0)}
                      style={{
                        padding: "14px 18px", borderRadius: 12,
                        border: "1.5px solid #E2DAD0", background: "transparent",
                        color: "#8C7E6F", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >← Terug</button>
                    <button onClick={() => setWizardStep(2)}
                      style={{
                        flex: 1, padding: "14px", borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg, #D4A574, #C09060)",
                        color: "#fff", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600,
                        cursor: "pointer", transition: "all 0.3s",
                      }}
                    >Volgende →</button>
                  </div>
                </div>
              )}

              {/* STEP 2: Bereidingstijd & genereer */}
              {wizardStep === 2 && !choosingRecipe && !loading && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <p style={{ fontSize: 12, color: "#A89B8A", margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    Hoeveel tijd heb je?
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 18 }}>
                    {[
                      { t: "< 15 min", emoji: "⚡", sub: "Supersnel" },
                      { t: "15-30 min", emoji: "🍳", sub: "Doordeweeks" },
                      { t: "30-60 min", emoji: "👨‍🍳", sub: "Uitgebreider" },
                      { t: "> 60 min", emoji: "🎂", sub: "Alle tijd" },
                    ].map(({ t, emoji, sub }) => (
                      <button key={t} onClick={() => setSelectedTime(selectedTime === t ? "" : t)}
                        style={{
                          padding: "16px 14px", borderRadius: 14,
                          border: selectedTime === t ? "2px solid #C85A3D" : "1.5px solid #EDE8E0",
                          background: selectedTime === t ? "#C85A3D0C" : "#FAF7F2",
                          cursor: "pointer", transition: "all 0.2s",
                          display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                        onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
                      >
                        <span style={{ fontSize: 24 }}>{emoji}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: selectedTime === t ? "#C85A3D" : "#3D2E1F", fontFamily: "'DM Sans', sans-serif" }}>{t}</div>
                          <div style={{ fontSize: 11, color: "#A89B8A", fontFamily: "'DM Sans', sans-serif" }}>{sub}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Summary */}
                  {(prompt.trim() || selectedCuisines.length > 0 || usePantry) && (
                    <div style={{
                      padding: "12px 14px", borderRadius: 12, background: "#F5EDE3",
                      marginBottom: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B5D4F",
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 11, color: "#A89B8A", textTransform: "uppercase", letterSpacing: 0.5 }}>Jouw keuzes</div>
                      {prompt.trim() && <div>📝 {prompt.length > 60 ? prompt.slice(0, 60) + "..." : prompt}</div>}
                      {selectedCuisines.length > 0 && <div>🌍 {selectedCuisines.join(", ")}</div>}
                      {selectedDiets.length > 0 && <div>🥗 {selectedDiets.join(", ")}</div>}
                      {selectedTime && <div>⏱ {selectedTime}</div>}
                      {usePantry && <div>🧊 Met voorraad ({pantry.length} producten)</div>}
                    </div>
                  )}

                  {error && <p style={{ color: "#C85A3D", fontSize: 13, margin: "0 0 10px", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>{error}</p>}

                  {/* Nav buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setWizardStep(1)}
                      style={{
                        padding: "14px 18px", borderRadius: 12,
                        border: "1.5px solid #E2DAD0", background: "transparent",
                        color: "#8C7E6F", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    >← Terug</button>
                    <button onClick={generateRecipe}
                      style={{
                        flex: 1, padding: "16px", borderRadius: 12, border: "none",
                        background: "linear-gradient(135deg, #D4A574 0%, #C09060 50%, #A67B50 100%)",
                        color: "#fff", fontFamily: "'DM Sans', sans-serif",
                        fontSize: 15, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.3s",
                        boxShadow: "0 6px 24px rgba(212,165,116,0.35)",
                        letterSpacing: 0.3,
                      }}
                      onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 32px rgba(212,165,116,0.45)"}
                      onMouseLeave={(e) => e.target.style.boxShadow = "0 6px 24px rgba(212,165,116,0.35)"}
                    >
                      ✨ Toon 5 receptideeën
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#B5A999", textAlign: "center", margin: "10px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                    ⌘+Enter als sneltoets
                  </p>
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
                    padding: "16px", borderRadius: 14, background: "#F5EDE3",
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: "3px solid #EDE8E0", borderTopColor: "#D4A574",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#3D2E1F", fontFamily: "'DM Sans', sans-serif" }}>
                        {genStatus || "Bezig..."}
                      </div>
                      <div style={{ fontSize: 12, color: "#A89B8A", fontFamily: "'DM Sans', sans-serif" }}>
                        Dit duurt meestal 5-10 seconden
                      </div>
                    </div>
                  </div>
                  {/* Skeleton cards */}
                  <div style={{ display: "flex", gap: 14, overflowX: "hidden" }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        flex: "0 0 200px", borderRadius: 16, overflow: "hidden",
                        background: "#FAF7F2", opacity: 0.6 + i * 0.1,
                      }}>
                        <div style={{
                          height: 100, background: "linear-gradient(90deg, #EDE8E0 25%, #F5EDE3 50%, #EDE8E0 75%)",
                          backgroundSize: "200% 100%", animation: "shimmer 1.5s ease infinite",
                        }} />
                        <div style={{ padding: 12 }}>
                          <div style={{
                            height: 14, borderRadius: 7, marginBottom: 8, width: "80%",
                            background: "linear-gradient(90deg, #EDE8E0 25%, #F5EDE3 50%, #EDE8E0 75%)",
                            backgroundSize: "200% 100%", animation: "shimmer 1.5s ease infinite",
                          }} />
                          <div style={{
                            height: 10, borderRadius: 5, width: "60%",
                            background: "linear-gradient(90deg, #EDE8E0 25%, #F5EDE3 50%, #EDE8E0 75%)",
                            backgroundSize: "200% 100%", animation: "shimmer 1.5s ease infinite",
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestion Cards */}
              {choosingRecipe && suggestions.length > 0 && !loading && (
                <div style={{ animation: "fadeIn 0.4s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <p style={{ fontSize: 12, color: "#A89B8A", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                      Selecteer een of meerdere gerechten →
                    </p>
                    <button onClick={() => { setChoosingRecipe(false); setSuggestions([]); setSelectedSuggestions([]); setPexelsImages({}); setWizardStep(0); }}
                      style={{ background: "none", border: "none", fontSize: 12, color: "#A89B8A", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}
                    >✕ Opnieuw</button>
                  </div>
                  <div style={{
                    display: "flex", gap: 14, overflowX: "auto", paddingBottom: 12, paddingTop: 6,
                    scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
                    scrollbarWidth: "none", msOverflowStyle: "none",
                    margin: "0 -24px", padding: "6px 24px 12px",
                  }}>
                    {suggestions.map((s, i) => {
                      const vis = CUISINE_VISUALS[s.cuisine] || DEFAULT_VISUAL;
                      const selected = selectedSuggestions.includes(i);
                      return (
                        <button key={i} onClick={() => toggleSuggestion(i)}
                          style={{
                            flex: "0 0 240px", scrollSnapAlign: "start",
                            borderRadius: 18, overflow: "hidden",
                            border: selected ? "3px solid #D4A574" : "3px solid transparent",
                            background: "#FFFCF7", cursor: "pointer",
                            boxShadow: selected ? "0 8px 32px rgba(212,165,116,0.3)" : "0 4px 20px rgba(139,111,71,0.12)",
                            transition: "all 0.3s ease", textAlign: "left",
                            display: "flex", flexDirection: "column",
                            transform: selected ? "translateY(-4px)" : "translateY(0)",
                          }}
                          onMouseEnter={(e) => {
                            if (!selected) {
                              e.currentTarget.style.transform = "translateY(-4px)";
                              e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,111,71,0.22)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selected) {
                              e.currentTarget.style.transform = "translateY(0)";
                              e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,111,71,0.12)";
                            }
                          }}
                        >
                          <div style={{
                            height: 140, width: "100%", position: "relative",
                            background: vis.gradient, overflow: "hidden",
                          }}>
                            {pexelsImages[i] && (
                              <img src={pexelsImages[i]} alt={s.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            )}
                            <div style={{
                              position: "absolute", bottom: 0, left: 0, right: 0, height: 70,
                              background: "linear-gradient(transparent, rgba(0,0,0,0.5))",
                            }} />
                            <div style={{
                              position: "absolute", top: 10, right: 10,
                              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                              borderRadius: 20, padding: "4px 10px",
                              fontSize: 11, fontWeight: 600, color: "#6B5D4F",
                              fontFamily: "'DM Sans', sans-serif",
                            }}>{vis.emoji} {s.cuisine}</div>
                            <div style={{
                              position: "absolute", bottom: 10, left: 10,
                              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                              borderRadius: 20, padding: "4px 10px",
                              fontSize: 11, fontWeight: 500, color: "#6B5D4F",
                              fontFamily: "'DM Sans', sans-serif",
                            }}>⏱ {s.prepTime}</div>
                            {/* Selection checkbox */}
                            <div style={{
                              position: "absolute", top: 10, left: 10,
                              width: 28, height: 28, borderRadius: "50%",
                              background: selected ? "#D4A574" : "rgba(255,255,255,0.92)",
                              backdropFilter: "blur(8px)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: selected ? 14 : 12, fontWeight: 700,
                              color: selected ? "#fff" : "#8B6F47",
                              fontFamily: "'DM Sans', sans-serif",
                              transition: "all 0.2s",
                            }}>{selected ? "✓" : i + 1}</div>
                          </div>
                          <div style={{ padding: "14px 16px 16px" }}>
                            <h3 style={{
                              margin: "0 0 6px", fontSize: 15, fontWeight: 700,
                              color: "#3D2E1F", fontFamily: "'Playfair Display', serif",
                              lineHeight: 1.3,
                            }}>{s.title}</h3>
                            <p style={{
                              margin: 0, fontSize: 12, color: "#8C7E6F",
                              fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4,
                              display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical", overflow: "hidden",
                            }}>{s.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {/* Action bar */}
                  {selectedSuggestions.length > 0 && (
                    <div style={{ animation: "fadeIn 0.2s ease", marginTop: 4 }}>
                      <button onClick={processSelectedSuggestions}
                        style={{
                          width: "100%", padding: "16px", borderRadius: 14, border: "none",
                          background: "linear-gradient(135deg, #D4A574 0%, #C09060 50%, #A67B50 100%)",
                          color: "#fff", fontFamily: "'DM Sans', sans-serif",
                          fontSize: 15, fontWeight: 700, cursor: "pointer",
                          boxShadow: "0 6px 24px rgba(212,165,116,0.35)",
                          transition: "all 0.3s",
                        }}
                        onMouseEnter={(e) => e.target.style.boxShadow = "0 8px 32px rgba(212,165,116,0.45)"}
                        onMouseLeave={(e) => e.target.style.boxShadow = "0 6px 24px rgba(212,165,116,0.35)"}
                      >
                        ✨ {selectedSuggestions.length === 1
                          ? `"${suggestions[selectedSuggestions[0]].title}" uitwerken`
                          : `${selectedSuggestions.length} recepten uitwerken`
                        }
                        {selectedSuggestions.length > 1 && " → weekplanner"}
                      </button>
                      <p style={{ fontSize: 11, color: "#B5A999", textAlign: "center", margin: "8px 0 0", fontFamily: "'DM Sans', sans-serif" }}>
                        {selectedSuggestions.length > 1
                          ? "Recepten worden uitgewerkt en je gaat naar de weekplanner"
                          : "Tik op meerdere kaarten om ze samen in te plannen"
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Collections */}
            {recipes.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  marginBottom: 10,
                }}>
                  <h3 style={{
                    fontFamily: "'Playfair Display', serif", fontSize: 17, color: "#3D2E1F",
                    margin: 0, display: "flex", alignItems: "center", gap: 8,
                  }}>📂 Collecties</h3>
                  <button onClick={() => setShowCreateCollection(!showCreateCollection)}
                    style={{
                      background: "none", border: "none", color: "#8B6F47",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                      fontWeight: 600, cursor: "pointer",
                    }}>{showCreateCollection ? "Annuleer" : "+ Nieuw"}</button>
                </div>
                {showCreateCollection && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 10, animation: "fadeIn 0.2s ease" }}>
                    <input value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Naam van collectie..."
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: 10,
                        border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" && newCollectionName.trim()) createCollection(newCollectionName.trim()); }}
                    />
                    <button onClick={() => newCollectionName.trim() && createCollection(newCollectionName.trim())}
                      disabled={!newCollectionName.trim()}
                      style={{
                        padding: "10px 18px", borderRadius: 10, border: "none",
                        background: newCollectionName.trim()
                          ? "linear-gradient(135deg, #D4A574, #C09060)" : "#EDE8E0",
                        color: newCollectionName.trim() ? "#fff" : "#B5A999",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                        fontWeight: 600, cursor: newCollectionName.trim() ? "pointer" : "default",
                      }}>Maak</button>
                  </div>
                )}
                <div style={{
                  display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4,
                  WebkitOverflowScrolling: "touch", scrollbarWidth: "none",
                }}>
                  <button onClick={() => setSelectedCollection(null)}
                    style={{
                      padding: "10px 18px", borderRadius: 14, border: "none", flexShrink: 0,
                      background: !selectedCollection
                        ? "linear-gradient(135deg, #D4A574, #C09060)" : "#FFFCF7",
                      color: !selectedCollection ? "#fff" : "#8C7E6F",
                      fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                      fontWeight: !selectedCollection ? 700 : 500,
                      cursor: "pointer", transition: "all 0.2s",
                      boxShadow: !selectedCollection ? "0 3px 12px rgba(212,165,116,0.3)" : "0 1px 6px rgba(139,111,71,0.08)",
                      border: !selectedCollection ? "none" : "1px solid #EDE8E0",
                    }}>Alle recepten</button>
                  {collections.map(col => (
                    <div key={col.id} style={{ position: "relative", flexShrink: 0 }}>
                      <button onClick={() => setSelectedCollection(selectedCollection === col.id ? null : col.id)}
                        style={{
                          padding: "10px 18px", borderRadius: 14, border: "none",
                          background: selectedCollection === col.id
                            ? "linear-gradient(135deg, #D4A574, #C09060)" : "#FFFCF7",
                          color: selectedCollection === col.id ? "#fff" : "#3D2E1F",
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                          fontWeight: selectedCollection === col.id ? 700 : 500,
                          cursor: "pointer", transition: "all 0.2s",
                          boxShadow: selectedCollection === col.id ? "0 3px 12px rgba(212,165,116,0.3)" : "0 1px 6px rgba(139,111,71,0.08)",
                          border: selectedCollection === col.id ? "none" : "1px solid #EDE8E0",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                        {col.name}
                        <span style={{ fontSize: 11, opacity: 0.7 }}>({col.recipeIds?.length || 0})</span>
                      </button>
                      {selectedCollection === col.id && (
                        <button onClick={(e) => { e.stopPropagation(); deleteCollection(col.id); }}
                          style={{
                            position: "absolute", top: -6, right: -6,
                            width: 20, height: 20, borderRadius: "50%",
                            background: "#C85A3D", color: "#fff", border: "none",
                            fontSize: 11, cursor: "pointer", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 6px rgba(200,90,61,0.3)",
                          }}>×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            {recipes.length > 0 && (
              <div style={{
                background: "#FFFCF7", borderRadius: 18, padding: "14px 20px",
                boxShadow: "0 2px 16px rgba(139,111,71,0.06)", marginBottom: 24,
                border: "1px solid #EDE8E0",
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ position: "relative" }}>
                    <span style={{
                      position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                      fontSize: 15, pointerEvents: "none",
                    }}>🔍</span>
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Zoek in recepten..."
                      style={{
                        width: "100%", padding: "10px 14px 10px 38px", borderRadius: 12,
                        border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                        fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <TagPill label="❤️ Favorieten" active={filterFav} onClick={() => setFilterFav(!filterFav)} color="#C85A3D" />
                    <CustomSelect value={filterTag} onChange={setFilterTag}
                      options={[{ value: "", label: "Alle tags" }, ...TAGS.map(t => ({ value: t, label: t }))]}
                      placeholder="Alle tags"
                    />
                    <CustomSelect value={filterUser} onChange={setFilterUser}
                      options={[
                        { value: "", label: "Iedereen" },
                        ...Array.from(new Set(recipes.map(r => r.addedBy).filter(Boolean))).map(u => ({ value: u, label: u })),
                      ]}
                      placeholder="Iedereen"
                    />
                    <CustomSelect value={sortBy} onChange={setSortBy}
                      options={[
                        { value: "", label: "Sorteren" },
                        { value: "langst-niet-gekookt", label: "🍳 Langst niet gekookt" },
                      ]}
                      placeholder="Sorteren"
                    />
                  </div>
                </div>
              </div>
            )}

            {filtered.length === 0 && recipes.length > 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "#A89B8A" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>Geen recepten gevonden met deze filters.</p>
              </div>
            )}

            {recipes.length === 0 && (
              <div style={{
                textAlign: "center", padding: "40px 24px 50px", color: "#A89B8A",
                background: "#FFFCF7", borderRadius: 20, border: "1px solid #EDE8E0",
                boxShadow: "0 2px 16px rgba(139,111,71,0.06)",
              }}>
                <img src="/images/empty-cookbook.webp" alt="Leeg kookboek"
                  style={{
                    width: 200, height: 200, objectFit: "cover", borderRadius: 16,
                    margin: "0 auto 20px", display: "block",
                    filter: "drop-shadow(0 4px 12px rgba(139,111,71,0.15))",
                  }}
                />
                <h3 style={{
                  fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#3D2E1F",
                  margin: "0 0 10px",
                }}>
                  Je kookboek is nog leeg!
                </h3>
                <p style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 14, maxWidth: 350,
                  margin: "0 auto", lineHeight: 1.6, color: "#8C7E6F",
                }}>
                  Genereer je eerste recept hierboven — AI maakt iets lekkers op maat!
                </p>
              </div>
            )}

            {/* Grouped card stacks by cuisine */}
            {(() => {
              // Group recipes by cuisine
              const groups = {};
              filtered.forEach(r => {
                const key = r.cuisine || "Overig";
                if (!groups[key]) groups[key] = [];
                groups[key].push(r);
              });
              const sortedKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);

              if (sortedKeys.length === 0) return null;

              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {sortedKeys.map(cuisine => {
                    const vis = CUISINE_VISUALS[cuisine] || DEFAULT_VISUAL;
                    const groupRecipes = groups[cuisine];
                    return (
                      <div key={cuisine}>
                        {/* Section header */}
                        <div style={{
                          display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
                          padding: "0 4px",
                        }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: vis.gradient,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, flexShrink: 0,
                          }}>{vis.emoji}</div>
                          <div>
                            <h3 style={{
                              fontFamily: "'Playfair Display', serif", fontSize: 17, fontWeight: 700,
                              color: "#3D2E1F", margin: 0, lineHeight: 1.2,
                            }}>{cuisine}</h3>
                            <p style={{
                              fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#A89B8A",
                              margin: 0,
                            }}>{groupRecipes.length} recept{groupRecipes.length !== 1 ? "en" : ""}</p>
                          </div>
                        </div>

                        {/* Card hand - stacked fan like cards in hand */}
                        {groupRecipes.length === 1 ? (
                          <RecipeCard key={groupRecipes[0].id} recipe={groupRecipes[0]} onToggleFav={toggleFav}
                            onRate={rateRecipe} onDelete={deleteRecipe} onTagChange={toggleTag} onShare={shareRecipe}
                            onMarkCooked={markAsCooked} collections={collections}
                            onAddToCollection={addToCollection} onRemoveFromCollection={removeFromCollection} onAddToPlanner={addToPlanner} />
                        ) : (
                          <CardHand recipes={groupRecipes} onToggleFav={toggleFav}
                            onRate={rateRecipe} onDelete={deleteRecipe} onTagChange={toggleTag} onShare={shareRecipe}
                            onMarkCooked={markAsCooked} collections={collections}
                            onAddToCollection={addToCollection} onRemoveFromCollection={removeFromCollection} onAddToPlanner={addToPlanner} />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "rgba(255,252,247,0.95)", backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid #E2DAD0",
        boxShadow: "0 -2px 20px rgba(0,0,0,0.05)",
        padding: "6px 16px env(safe-area-inset-bottom, 10px)",
        zIndex: 1000,
      }}>
        <div style={{
          maxWidth: 520, margin: "0 auto",
          display: "grid", gridTemplateColumns: `repeat(${NAV_ITEMS.length}, 1fr)`,
          gap: 4,
        }}>
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center",
                  gap: 3, padding: "8px 2px 6px", border: "none",
                  cursor: "pointer",
                  background: "transparent", transition: "all 0.2s",
                  borderRadius: 10,
                }}
              >
                <span style={{
                  lineHeight: 1,
                  background: isActive ? "linear-gradient(135deg, #D4A574, #C09060)" : "transparent",
                  borderRadius: 10, padding: isActive ? "6px 16px" : "6px 8px",
                  transition: "all 0.25s",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {NAV_ICONS[item.id] ? (
                    <img src={NAV_ICONS[item.id]} alt={item.label}
                      style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 4 }} />
                  ) : (
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                  )}
                </span>
                <span style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 11, fontWeight: isActive ? 700 : 500,
                  color: isActive ? "#8B6F47" : "#A89B8A",
                  transition: "all 0.2s", whiteSpace: "nowrap",
                  letterSpacing: 0.2,
                }}>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
