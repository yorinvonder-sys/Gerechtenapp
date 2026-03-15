import { useState } from "react";
import { supabase } from "./supabaseClient";

const ALLERGIES = [
  { id: "gluten", label: "Gluten", emoji: "🌾" },
  { id: "lactose", label: "Lactose / Melk", emoji: "🥛" },
  { id: "noten", label: "Noten", emoji: "🥜" },
  { id: "pinda", label: "Pinda's", emoji: "🥜" },
  { id: "schaaldieren", label: "Schaaldieren", emoji: "🦐" },
  { id: "vis", label: "Vis", emoji: "🐟" },
  { id: "ei", label: "Eieren", emoji: "🥚" },
  { id: "soja", label: "Soja", emoji: "🫘" },
  { id: "selderij", label: "Selderij", emoji: "🥬" },
  { id: "mosterd", label: "Mosterd", emoji: "🟡" },
  { id: "sesam", label: "Sesamzaad", emoji: "🫘" },
  { id: "sulfiet", label: "Sulfiet", emoji: "🍷" },
];

const DIETS = [
  { id: "Vegetarisch", label: "Vegetarisch", emoji: "🥗" },
  { id: "Veganistisch", label: "Veganistisch", emoji: "🌱" },
  { id: "Pescotarisch", label: "Pescotarisch", emoji: "🐟" },
  { id: "Koolhydraatarm", label: "Koolhydraatarm", emoji: "🥩" },
  { id: "Eiwitrijk", label: "Eiwitrijk", emoji: "💪" },
  { id: "Glutenvrij", label: "Glutenvrij", emoji: "🚫🌾" },
  { id: "Lactosevrij", label: "Lactosevrij", emoji: "🚫🥛" },
];

const CUISINES = [
  { id: "Italiaans", label: "Italiaans", emoji: "🍝" },
  { id: "Aziatisch", label: "Aziatisch", emoji: "🥢" },
  { id: "Mexicaans", label: "Mexicaans", emoji: "🌮" },
  { id: "Frans", label: "Frans", emoji: "🥐" },
  { id: "Grieks", label: "Grieks", emoji: "🫒" },
  { id: "Indiaas", label: "Indiaas", emoji: "🍛" },
  { id: "Japans", label: "Japans", emoji: "🍣" },
  { id: "Thais", label: "Thais", emoji: "🍲" },
  { id: "Hollands", label: "Hollands", emoji: "🧇" },
  { id: "Amerikaans", label: "Amerikaans", emoji: "🍔" },
  { id: "Midden-Oosters", label: "Midden-Oosters", emoji: "🧆" },
  { id: "Afrikaans", label: "Afrikaans", emoji: "🍖" },
];

const COOKING_LEVELS = [
  { id: "beginner", label: "Beginner", emoji: "🌱", desc: "Ik kan eenvoudige gerechten maken" },
  { id: "gemiddeld", label: "Gemiddeld", emoji: "👨‍🍳", desc: "Ik kan de meeste recepten volgen" },
  { id: "gevorderd", label: "Gevorderd", emoji: "⭐", desc: "Ik experimenteer graag in de keuken" },
];

const COOKING_TIMES = [
  { id: "< 15 min", label: "Snel", emoji: "⚡", desc: "Minder dan 15 minuten" },
  { id: "15-30 min", label: "Gemiddeld", emoji: "⏱️", desc: "15 tot 30 minuten" },
  { id: "30-60 min", label: "Uitgebreid", emoji: "🍳", desc: "30 tot 60 minuten" },
  { id: "> 60 min", label: "Geen limiet", emoji: "👨‍🍳", desc: "Meer dan 60 minuten" },
];

const COMMON_DISLIKES = [
  "Spruitjes", "Olijven", "Ansjovies", "Lever", "Blauwe kaas",
  "Koriander", "Aubergine", "Champignons", "Paprika", "Ui",
  "Kokos", "Venkel", "Bietjes", "Kappertjes", "Artisjok",
];

const HOUSEHOLD_SIZES = [
  { id: 1, label: "1 persoon", emoji: "👤" },
  { id: 2, label: "2 personen", emoji: "👫" },
  { id: 3, label: "3-4 personen", emoji: "👨‍👩‍👧" },
  { id: 5, label: "5+ personen", emoji: "👨‍👩‍👧‍👦" },
];

const STEPS = [
  { title: "Welkom!", subtitle: "Laten we je voorkeuren instellen" },
  { title: "Huishouden", subtitle: "Voor hoeveel personen kook je meestal?" },
  { title: "Allergieën", subtitle: "Heb je allergieën of intoleranties?" },
  { title: "Dieet", subtitle: "Volg je een speciaal dieet?" },
  { title: "Niet lekker", subtitle: "Wat lust je absoluut niet?" },
  { title: "Keukens", subtitle: "Welke keukens vind je lekker?" },
  { title: "Kookniveau", subtitle: "Hoe ervaren ben je in de keuken?" },
  { title: "Kooktijd", subtitle: "Hoeveel tijd heb je meestal?" },
];

export default function OnboardingPage({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState(
    user.user_metadata?.full_name || ""
  );
  const [householdSize, setHouseholdSize] = useState(null);
  const [allergies, setAllergies] = useState([]);
  const [dietPrefs, setDietPrefs] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [customDislike, setCustomDislike] = useState("");
  const [favCuisines, setFavCuisines] = useState([]);
  const [cookingLevel, setCookingLevel] = useState("");
  const [cookingTime, setCookingTime] = useState("");

  const totalSteps = STEPS.length;

  const toggleItem = (list, setList, item) => {
    setList((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const addCustomDislike = () => {
    const trimmed = customDislike.trim();
    if (trimmed && !dislikes.includes(trimmed)) {
      setDislikes((prev) => [...prev, trimmed]);
      setCustomDislike("");
    }
  };

  const canProceed = () => {
    if (step === 0) return displayName.trim().length > 0;
    if (step === 1) return householdSize !== null;
    // Steps 2-4 (allergies, diet, dislikes) are optional
    if (step === 5) return favCuisines.length > 0;
    if (step === 6) return cookingLevel !== "";
    if (step === 7) return cookingTime !== "";
    return true;
  };

  const handleFinish = async () => {
    setSaving(true);
    const profileData = {
      id: user.id,
      display_name: displayName.trim(),
      household_size: householdSize,
      allergies,
      dietary_preferences: dietPrefs,
      dislikes,
      favorite_cuisine: favCuisines,
      cooking_level: cookingLevel,
      preferred_cooking_time: cookingTime,
      onboarding_completed: true,
    };
    const { error } = await supabase.from("profiles").upsert(profileData);
    if (error) {
      console.error("Onboarding save error:", error);
      alert("Er ging iets mis bij het opslaan: " + error.message);
    } else {
      onComplete(profileData);
    }
    setSaving(false);
  };

  const next = () => {
    if (step < totalSteps - 1) setStep(step + 1);
    else handleFinish();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const pillStyle = (active, color = "#8B6F47") => ({
    padding: "10px 18px",
    borderRadius: 16,
    border: active ? `2px solid ${color}` : "1.5px solid #D5CEC4",
    background: active ? `${color}18` : "#FAF7F2",
    color: active ? color : "#8C7E6F",
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 8,
  });

  const cardStyle = (active, color = "#8B6F47") => ({
    padding: "16px 20px",
    borderRadius: 16,
    border: active ? `2px solid ${color}` : "1.5px solid #E2DAD0",
    background: active ? `${color}10` : "#FFFCF7",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 14,
  });

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🍳</div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                color: "#3D2E1F",
                margin: "0 0 8px",
              }}
            >
              Welkom bij Gerechtenapp!
            </h2>
            <p
              style={{
                color: "#8C7E6F",
                fontSize: 14,
                lineHeight: 1.6,
                margin: "0 0 28px",
              }}
            >
              Beantwoord een paar korte vragen zodat we recepten kunnen aanpassen
              aan jouw smaak en voorkeuren.
            </p>
            <div style={{ textAlign: "left" }}>
              <label
                style={{
                  fontSize: 13,
                  color: "#8C7E6F",
                  fontWeight: 600,
                  display: "block",
                  marginBottom: 8,
                }}
              >
                Hoe wil je genoemd worden?
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Je naam"
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: "1.5px solid #E2DAD0",
                  background: "#FAF7F2",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 15,
                  color: "#3D2E1F",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {HOUSEHOLD_SIZES.map((h) => (
              <button
                key={h.id}
                onClick={() => setHouseholdSize(h.id)}
                style={cardStyle(householdSize === h.id)}
              >
                <span style={{ fontSize: 28 }}>{h.emoji}</span>
                <span
                  style={{
                    fontSize: 15,
                    color:
                      householdSize === h.id ? "#8B6F47" : "#3D2E1F",
                    fontWeight: householdSize === h.id ? 600 : 400,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {h.label}
                </span>
              </button>
            ))}
          </div>
        );

      case 2:
        return (
          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {ALLERGIES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleItem(allergies, setAllergies, a.id)}
                  style={pillStyle(allergies.includes(a.id), "#C85A3D")}
                >
                  <span>{a.emoji}</span> {a.label}
                </button>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#A89B8A",
                margin: 0,
                textAlign: "center",
              }}
            >
              Geen allergieën? Sla deze stap dan over.
            </p>
          </div>
        );

      case 3:
        return (
          <div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DIETS.map((d) => (
                <button
                  key={d.id}
                  onClick={() => toggleItem(dietPrefs, setDietPrefs, d.id)}
                  style={pillStyle(dietPrefs.includes(d.id), "#6B8F5E")}
                >
                  <span>{d.emoji}</span> {d.label}
                </button>
              ))}
            </div>
            <p
              style={{
                fontSize: 12,
                color: "#A89B8A",
                margin: "16px 0 0",
                textAlign: "center",
              }}
            >
              Geen speciaal dieet? Sla deze stap dan over.
            </p>
          </div>
        );

      case 4:
        return (
          <div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              {COMMON_DISLIKES.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleItem(dislikes, setDislikes, d)}
                  style={pillStyle(dislikes.includes(d), "#C85A3D")}
                >
                  {d}
                </button>
              ))}
            </div>
            {/* Custom dislike toevoegen */}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                value={customDislike}
                onChange={(e) => setCustomDislike(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomDislike()}
                placeholder="Iets anders toevoegen..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1.5px solid #E2DAD0",
                  background: "#FAF7F2",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#3D2E1F",
                  outline: "none",
                }}
              />
              <button
                onClick={addCustomDislike}
                style={{
                  padding: "10px 16px",
                  borderRadius: 12,
                  border: "none",
                  background: "#D4A574",
                  color: "#fff",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                +
              </button>
            </div>
            {/* Toon custom dislikes die niet in COMMON_DISLIKES zitten */}
            {dislikes.filter((d) => !COMMON_DISLIKES.includes(d)).length >
              0 && (
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginTop: 12,
                }}
              >
                {dislikes
                  .filter((d) => !COMMON_DISLIKES.includes(d))
                  .map((d) => (
                    <button
                      key={d}
                      onClick={() => toggleItem(dislikes, setDislikes, d)}
                      style={pillStyle(true, "#C85A3D")}
                    >
                      {d} ✕
                    </button>
                  ))}
              </div>
            )}
            <p
              style={{
                fontSize: 12,
                color: "#A89B8A",
                margin: "12px 0 0",
                textAlign: "center",
              }}
            >
              Alles lekker? Sla deze stap dan over.
            </p>
          </div>
        );

      case 5:
        return (
          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap" }}
          >
            {CUISINES.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleItem(favCuisines, setFavCuisines, c.id)}
                style={pillStyle(favCuisines.includes(c.id))}
              >
                <span>{c.emoji}</span> {c.label}
              </button>
            ))}
          </div>
        );

      case 6:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {COOKING_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => setCookingLevel(l.id)}
                style={cardStyle(cookingLevel === l.id)}
              >
                <span style={{ fontSize: 28 }}>{l.emoji}</span>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      color:
                        cookingLevel === l.id ? "#8B6F47" : "#3D2E1F",
                      fontWeight: cookingLevel === l.id ? 600 : 400,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {l.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#A89B8A",
                      marginTop: 2,
                    }}
                  >
                    {l.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      case 7:
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {COOKING_TIMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setCookingTime(t.id)}
                style={cardStyle(cookingTime === t.id)}
              >
                <span style={{ fontSize: 28 }}>{t.emoji}</span>
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      color:
                        cookingTime === t.id ? "#8B6F47" : "#3D2E1F",
                      fontWeight: cookingTime === t.id ? 600 : 400,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {t.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "#A89B8A",
                      marginTop: 2,
                    }}
                  >
                    {t.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #F5EDE3 0%, #EDE3D5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: "#FFFCF7",
          borderRadius: 28,
          boxShadow: "0 8px 40px rgba(139,111,71,0.12)",
          border: "1px solid #EDE8E0",
          overflow: "hidden",
        }}
      >
        {/* Progress bar */}
        <div
          style={{
            height: 4,
            background: "#EDE8E0",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${((step + 1) / totalSteps) * 100}%`,
              background: "linear-gradient(90deg, #D4A574, #C09060)",
              borderRadius: 2,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <div style={{ padding: "32px 28px 28px" }}>
          {/* Step indicator */}
          {step > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "#A89B8A",
                  fontWeight: 500,
                }}
              >
                Stap {step} van {totalSteps - 1}
              </span>
              <button
                onClick={() => {
                  // Skip rest of onboarding
                  if (step < totalSteps - 1) setStep(totalSteps - 1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#A89B8A",
                  fontSize: 12,
                  cursor: "pointer",
                  textDecoration: "underline",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Overslaan
              </button>
            </div>
          )}

          {/* Title */}
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 22,
              color: "#3D2E1F",
              margin: "0 0 4px",
            }}
          >
            {STEPS[step].title}
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "#8C7E6F",
              margin: "0 0 24px",
            }}
          >
            {STEPS[step].subtitle}
          </p>

          {/* Content */}
          {renderStep()}

          {/* Navigation */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 28,
            }}
          >
            {step > 0 && (
              <button
                onClick={prev}
                style={{
                  padding: "14px 20px",
                  borderRadius: 14,
                  border: "1.5px solid #D5CEC4",
                  background: "transparent",
                  color: "#8C7E6F",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Terug
              </button>
            )}
            <button
              onClick={next}
              disabled={!canProceed() || saving}
              style={{
                flex: 1,
                padding: "14px",
                borderRadius: 14,
                border: "none",
                background:
                  canProceed() && !saving
                    ? step === totalSteps - 1
                      ? "linear-gradient(135deg, #6B8F5E, #5A7D4E)"
                      : "linear-gradient(135deg, #D4A574 0%, #C09060 50%, #A67B50 100%)"
                    : "#E2DAD0",
                color: canProceed() && !saving ? "#fff" : "#B5A999",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                cursor: canProceed() && !saving ? "pointer" : "not-allowed",
                transition: "all 0.3s",
                boxShadow:
                  canProceed() && !saving
                    ? "0 6px 24px rgba(212,165,116,0.35)"
                    : "none",
              }}
            >
              {saving
                ? "Opslaan..."
                : step === totalSteps - 1
                ? "Aan de slag!"
                : "Volgende"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
