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

function RecipeCard({ recipe, onToggleFav, onRate, onDelete, onTagChange, onShare }) {
  const [expanded, setExpanded] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const visual = CUISINE_VISUALS[recipe.cuisine] || DEFAULT_VISUAL;

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

  useEffect(() => {
    (async () => {
      try {
        const [recipesRes, pantryRes, profileRes, sharedRes] = await Promise.all([
          supabase.from("recipes").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("pantry_items").select("*").eq("user_id", user.id),
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("shared_recipes").select("recipe_id, recipes(*)").eq("shared_with", user.id),
        ]);
        if (recipesRes.data) {
          const ownRecipes = recipesRes.data.map(r => ({
            id: r.id, title: r.title, description: r.description, cuisine: r.cuisine,
            prepTime: r.prep_time, servings: r.servings, ingredients: r.ingredients,
            steps: r.steps, tips: r.tips, addedBy: r.added_by,
            favorite: r.favorite, rating: r.rating, tags: r.tags,
            usedPantry: r.used_pantry, createdAt: r.created_at, isOwn: true,
          }));
          const sharedRecipes = (sharedRes.data || [])
            .filter(s => s.recipes)
            .map(s => ({
              id: s.recipes.id, title: s.recipes.title, description: s.recipes.description,
              cuisine: s.recipes.cuisine, prepTime: s.recipes.prep_time, servings: s.recipes.servings,
              ingredients: s.recipes.ingredients, steps: s.recipes.steps, tips: s.recipes.tips,
              addedBy: s.recipes.added_by, favorite: s.recipes.favorite, rating: s.recipes.rating,
              tags: s.recipes.tags, usedPantry: s.recipes.used_pantry, createdAt: s.recipes.created_at,
              isShared: true,
            }));
          setRecipes([...ownRecipes, ...sharedRecipes]);
        }
        if (pantryRes.data) setPantry(pantryRes.data.map(p => ({ id: p.id, name: p.name, category: p.category, quantity: p.quantity })));
        if (profileRes.data) setProfile(profileRes.data);
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
    await supabase.from("recipes").update(dbUpdates).eq("id", id).eq("user_id", user.id);
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, [user.id]);

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
[{"title":"naam gerecht","description":"korte appetijt-opwekkende beschrijving in 1 zin","cuisine":"type keuken","prepTime":"bereidingstijd","imageQuery":"english search term for this specific dish for image search"},{"title":"..."},...]
Geef precies 5 items. De imageQuery moet een specifieke Engelse zoekterm zijn voor het gerecht (bijv. "pad thai noodles", "mushroom risotto").

Gebruikerswensen:
${userPrompt}` }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 8192, responseMimeType: "application/json" },
      });
      if (data.error) throw new Error(data.error.message || "API fout");
      const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Geen suggesties ontvangen");
      setSuggestions(parsed.slice(0, 5));
      setChoosingRecipe(true);
      setGenStatus("");
    } catch (err) {
      setError("Oeps! " + (err.message || "Er ging iets mis.")); setGenStatus("");
    }
    setLoading(false);
  };

  const pickSuggestion = async (suggestion) => {
    setLoading(true); setChoosingRecipe(false);
    setGenStatus("Volledig recept uitwerken...");

    const servings = profile?.household_size || 2;
    const userPrompt = buildUserPrompt();

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
        setRecipes(prev => [{ ...newRecipe, id: saved.id, isOwn: true }, ...prev]);
      }
      setPrompt(""); setSelectedCuisines([]); setSelectedDiets([]); setSelectedTime(""); setUsePantry(false); setSuggestions([]); setGenStatus(""); setWizardStep(0);
    } catch (err) {
      setError("Oeps! " + (err.message || "Er ging iets mis.")); setGenStatus("");
    }
    setLoading(false);
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
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q) || r.cuisine?.toLowerCase().includes(q);
    }
    return true;
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
          <WeekPlanner user={user} recipes={recipes} />
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
                      Swipe of klik om te kiezen →
                    </p>
                    <button onClick={() => { setChoosingRecipe(false); setSuggestions([]); setWizardStep(0); }}
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
                      return (
                        <button key={i} onClick={() => pickSuggestion(s)}
                          style={{
                            flex: "0 0 240px", scrollSnapAlign: "start",
                            borderRadius: 18, border: "none", overflow: "hidden",
                            background: "#FFFCF7", cursor: "pointer",
                            boxShadow: "0 4px 20px rgba(139,111,71,0.12)",
                            transition: "all 0.3s ease", textAlign: "left",
                            display: "flex", flexDirection: "column",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-6px) scale(1.02)";
                            e.currentTarget.style.boxShadow = "0 12px 40px rgba(139,111,71,0.22)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0) scale(1)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(139,111,71,0.12)";
                          }}
                        >
                          <div style={{
                            height: 140, width: "100%", position: "relative",
                            background: vis.gradient, overflow: "hidden",
                          }}>
                            <img
                              src={`https://source.unsplash.com/520x300/?${encodeURIComponent(s.imageQuery || s.title)},food`}
                              alt={s.title}
                              style={{
                                width: "100%", height: "100%", objectFit: "cover",
                                opacity: 0, transition: "opacity 0.4s ease",
                              }}
                              onLoad={(e) => e.target.style.opacity = 1}
                              onError={(e) => e.target.style.display = "none"}
                            />
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
                            {/* Number badge */}
                            <div style={{
                              position: "absolute", top: 10, left: 10,
                              width: 26, height: 26, borderRadius: "50%",
                              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 12, fontWeight: 700, color: "#8B6F47",
                              fontFamily: "'DM Sans', sans-serif",
                            }}>{i + 1}</div>
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
                            <div style={{
                              marginTop: 10, padding: "8px 0 0",
                              borderTop: "1px solid #F0EBE4",
                              fontSize: 12, fontWeight: 600, color: "#D4A574",
                              fontFamily: "'DM Sans', sans-serif",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                            }}>
                              Kies dit gerecht →
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

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

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {filtered.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} onToggleFav={toggleFav}
                  onRate={rateRecipe} onDelete={deleteRecipe} onTagChange={toggleTag} onShare={shareRecipe} />
              ))}
            </div>
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
