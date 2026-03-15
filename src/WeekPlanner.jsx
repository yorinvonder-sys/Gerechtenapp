import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

const MEAL_TYPES = [
  { id: "ontbijt", label: "Ontbijt", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "diner", label: "Diner", emoji: "🍽️" },
];

const DAY_NAMES = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
const DAY_SHORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function isToday(d) {
  const now = new Date();
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

export default function WeekPlanner({ user, recipes }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [mealPlans, setMealPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPicker, setShowPicker] = useState(null); // { date, mealType }
  const [searchQuery, setSearchQuery] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [sharedUsers, setSharedUsers] = useState([]);
  const [showGroceries, setShowGroceries] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  useEffect(() => {
    loadMealPlans();
    loadSharedUsers();
  }, [weekOffset]);

  const loadMealPlans = async () => {
    setLoading(true);
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[6]);
    const { data } = await supabase
      .from("meal_plans")
      .select("*, recipes(title, cuisine, prep_time)")
      .gte("date", startDate)
      .lte("date", endDate)
      .or(`user_id.eq.${user.id}`);
    setMealPlans(data || []);
    setLoading(false);
  };

  const loadSharedUsers = async () => {
    const { data } = await supabase
      .from("shared_meal_plans")
      .select("shared_with, profiles!shared_meal_plans_shared_with_fkey(display_name)")
      .eq("owner_id", user.id);
    setSharedUsers(data || []);
  };

  const assignRecipe = async (date, mealType, recipeId) => {
    const { error } = await supabase.from("meal_plans").upsert({
      user_id: user.id,
      date: formatDate(date),
      meal_type: mealType,
      recipe_id: recipeId,
      custom_meal: null,
    }, { onConflict: "user_id,date,meal_type" });
    if (!error) {
      await loadMealPlans();
      setShowPicker(null);
      setSearchQuery("");
    }
  };

  const assignCustomMeal = async (date, mealType, text) => {
    if (!text.trim()) return;
    const { error } = await supabase.from("meal_plans").upsert({
      user_id: user.id,
      date: formatDate(date),
      meal_type: mealType,
      recipe_id: null,
      custom_meal: text.trim(),
    }, { onConflict: "user_id,date,meal_type" });
    if (!error) {
      await loadMealPlans();
      setShowPicker(null);
      setSearchQuery("");
    }
  };

  const removeMeal = async (date, mealType) => {
    await supabase
      .from("meal_plans")
      .delete()
      .eq("user_id", user.id)
      .eq("date", formatDate(date))
      .eq("meal_type", mealType);
    await loadMealPlans();
  };

  const sharePlanning = async () => {
    if (!shareEmail.trim()) return;
    setShareStatus("Zoeken...");
    const { data: targetUser } = await supabase.rpc("get_user_id_by_email", {
      email_input: shareEmail.trim(),
    });
    if (!targetUser) {
      setShareStatus("Gebruiker niet gevonden");
      return;
    }
    const { error } = await supabase.from("shared_meal_plans").upsert({
      owner_id: user.id,
      shared_with: targetUser,
    });
    if (error) {
      setShareStatus("Er ging iets mis");
    } else {
      setShareStatus("Gedeeld!");
      setShareEmail("");
      loadSharedUsers();
      setTimeout(() => setShareStatus(""), 2000);
    }
  };

  const getMeal = (date, mealType) => {
    return mealPlans.find(
      (m) => m.date === formatDate(date) && m.meal_type === mealType
    );
  };

  // Boodschappenlijst: verzamel alle ingrediënten van geplande recepten
  const groceryList = useMemo(() => {
    const ingredients = {};
    mealPlans.forEach((m) => {
      if (m.recipe_id && m.recipes) {
        const recipe = recipes.find((r) => r.id === m.recipe_id);
        if (recipe?.ingredients) {
          recipe.ingredients.forEach((ing) => {
            const key = ing.toLowerCase().trim();
            if (!ingredients[key]) ingredients[key] = { name: ing, count: 0 };
            ingredients[key].count++;
          });
        }
      }
    });
    return Object.values(ingredients).sort((a, b) => a.name.localeCompare(b.name));
  }, [mealPlans, recipes]);

  const filteredRecipes = recipes.filter(
    (r) =>
      r.isOwn &&
      r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} ${months[start.getMonth()]}`;
    }
    return `${start.getDate()} ${months[start.getMonth()]} – ${end.getDate()} ${months[end.getMonth()]}`;
  })();

  return (
    <div>
      {/* Week header */}
      <div style={{
        background: "#FFFCF7", borderRadius: 24, padding: "20px 24px",
        boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 16,
        border: "1px solid #EDE8E0",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
        }}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={navBtnStyle}>←</button>
          <div style={{ textAlign: "center" }}>
            <h3 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#3D2E1F",
              margin: 0,
            }}>Weekplanner</h3>
            <p style={{ fontSize: 13, color: "#8C7E6F", margin: "4px 0 0" }}>{weekLabel}</p>
          </div>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={navBtnStyle}>→</button>
        </div>

        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} style={{
            width: "100%", padding: "8px", borderRadius: 10,
            border: "1px solid #E2DAD0", background: "transparent",
            color: "#8B6F47", fontSize: 12, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            marginBottom: 8,
          }}>Naar deze week</button>
        )}

        {/* Actieknoppen */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowGroceries(!showGroceries)} style={{
            flex: 1, padding: "10px", borderRadius: 12,
            border: showGroceries ? "2px solid #6B8F5E" : "1.5px solid #E2DAD0",
            background: showGroceries ? "#6B8F5E10" : "transparent",
            color: showGroceries ? "#5A7D4E" : "#8C7E6F",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", transition: "all 0.2s",
          }}>🛒 Boodschappen</button>
          <button onClick={() => setShowShare(!showShare)} style={{
            flex: 1, padding: "10px", borderRadius: 12,
            border: showShare ? "2px solid #8B6F47" : "1.5px solid #E2DAD0",
            background: showShare ? "#8B6F4710" : "transparent",
            color: showShare ? "#8B6F47" : "#8C7E6F",
            fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer", transition: "all 0.2s",
          }}>👥 Delen</button>
        </div>
      </div>

      {/* Boodschappenlijst */}
      {showGroceries && (
        <div style={{
          background: "#FFFCF7", borderRadius: 20, padding: "20px 24px",
          boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 16,
          border: "1px solid #EDE8E0", animation: "fadeIn 0.3s ease",
        }}>
          <h4 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#3D2E1F",
            margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8,
          }}>🛒 Boodschappenlijst</h4>
          {groceryList.length === 0 ? (
            <p style={{ fontSize: 13, color: "#A89B8A", margin: 0 }}>
              Plan recepten in om een boodschappenlijst te genereren.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {groceryList.map((item) => (
                <div key={item.name} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", borderRadius: 10, background: "#FAF7F2",
                  border: "1px solid #EDE8E0",
                }}>
                  <span style={{ fontSize: 13, color: "#3D2E1F", fontFamily: "'DM Sans', sans-serif" }}>
                    {item.name}
                  </span>
                  {item.count > 1 && (
                    <span style={{
                      fontSize: 11, color: "#8B6F47", fontWeight: 600,
                      background: "#8B6F4715", padding: "2px 8px", borderRadius: 8,
                    }}>×{item.count}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delen */}
      {showShare && (
        <div style={{
          background: "#FFFCF7", borderRadius: 20, padding: "20px 24px",
          boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 16,
          border: "1px solid #EDE8E0", animation: "fadeIn 0.3s ease",
        }}>
          <h4 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#3D2E1F",
            margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8,
          }}>👥 Planning delen</h4>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input type="email" value={shareEmail} onChange={(e) => setShareEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sharePlanning()}
              placeholder="E-mailadres van huisgenoot"
              style={{
                flex: 1, padding: "10px 14px", borderRadius: 10,
                border: "1.5px solid #E2DAD0", background: "#FAF7F2",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                outline: "none",
              }} />
            <button onClick={sharePlanning} style={{
              padding: "10px 16px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, #D4A574, #C09060)",
              color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}>Deel</button>
          </div>
          {shareStatus && (
            <p style={{
              fontSize: 12, margin: "0 0 8px",
              color: shareStatus === "Gedeeld!" ? "#6B8F5E" : shareStatus === "Zoeken..." ? "#8B6F47" : "#C85A3D",
            }}>{shareStatus}</p>
          )}
          {sharedUsers.length > 0 && (
            <div>
              <p style={{ fontSize: 12, color: "#8C7E6F", margin: "0 0 6px", fontWeight: 600 }}>Gedeeld met:</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {sharedUsers.map((s) => (
                  <span key={s.shared_with} style={{
                    padding: "4px 12px", borderRadius: 12, background: "#6B8F5E15",
                    border: "1px solid #6B8F5E40", color: "#5A7D4E",
                    fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                  }}>{s.profiles?.display_name || "Gebruiker"}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weekoverzicht */}
      {weekDates.map((date, dayIdx) => {
        const today = isToday(date);
        return (
          <div key={formatDate(date)} style={{
            background: today ? "#FFFCF7" : "#FFFCF7",
            borderRadius: 20, padding: "16px 18px", marginBottom: 10,
            boxShadow: today ? "0 4px 28px rgba(139,111,71,0.12)" : "0 2px 12px rgba(139,111,71,0.06)",
            border: today ? "2px solid #D4A574" : "1px solid #EDE8E0",
            transition: "all 0.2s",
          }}>
            {/* Dag header */}
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 10,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: today
                  ? "linear-gradient(135deg, #D4A574, #C09060)"
                  : "#FAF7F2",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                border: today ? "none" : "1px solid #EDE8E0",
              }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: today ? "#fff" : "#A89B8A",
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
                }}>{DAY_SHORT[dayIdx]}</span>
                <span style={{
                  fontSize: 15, fontWeight: 700, color: today ? "#fff" : "#3D2E1F",
                  fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2,
                }}>{date.getDate()}</span>
              </div>
              <div>
                <span style={{
                  fontSize: 14, fontWeight: 600, color: "#3D2E1F",
                  fontFamily: "'DM Sans', sans-serif",
                }}>{DAY_NAMES[dayIdx]}</span>
                {today && (
                  <span style={{
                    fontSize: 11, color: "#D4A574", fontWeight: 600, marginLeft: 8,
                  }}>Vandaag</span>
                )}
              </div>
            </div>

            {/* Maaltijden */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {MEAL_TYPES.map((mt) => {
                const meal = getMeal(date, mt.id);
                const isPicking = showPicker?.date === formatDate(date) && showPicker?.mealType === mt.id;
                return (
                  <div key={mt.id}>
                    <div
                      onClick={() => {
                        if (meal) return;
                        setShowPicker(isPicking ? null : { date: formatDate(date), mealType: mt.id, dateObj: date });
                        setSearchQuery("");
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 12,
                        background: meal ? "#FAF7F2" : isPicking ? "#8B6F4708" : "transparent",
                        border: isPicking ? "1.5px solid #D4A574" : meal ? "1px solid #EDE8E0" : "1px dashed #E2DAD0",
                        cursor: meal ? "default" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{mt.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontSize: 11, color: "#A89B8A", fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{mt.label}</span>
                        {meal && (
                          <p style={{
                            fontSize: 13, color: "#3D2E1F", margin: "2px 0 0",
                            fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                          }}>
                            {meal.recipes?.title || meal.custom_meal}
                          </p>
                        )}
                        {!meal && !isPicking && (
                          <p style={{
                            fontSize: 12, color: "#C5BAA8", margin: "2px 0 0",
                            fontFamily: "'DM Sans', sans-serif",
                          }}>+ Voeg toe</p>
                        )}
                      </div>
                      {meal && (
                        <button onClick={(e) => { e.stopPropagation(); removeMeal(date, mt.id); }}
                          style={{
                            background: "none", border: "none", fontSize: 14,
                            color: "#C85A3D", cursor: "pointer", padding: "4px",
                            opacity: 0.5, transition: "opacity 0.2s",
                          }}
                          onMouseEnter={(e) => e.target.style.opacity = 1}
                          onMouseLeave={(e) => e.target.style.opacity = 0.5}
                        >✕</button>
                      )}
                    </div>

                    {/* Recept picker */}
                    {isPicking && (
                      <div style={{
                        marginTop: 6, padding: "12px", borderRadius: 12,
                        background: "#FAF7F2", border: "1px solid #EDE8E0",
                        animation: "fadeIn 0.2s ease",
                      }}>
                        <input type="text" value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Zoek een recept..."
                          autoFocus
                          style={{
                            width: "100%", padding: "8px 12px", borderRadius: 8,
                            border: "1.5px solid #E2DAD0", background: "#FFFCF7",
                            fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                            color: "#3D2E1F", outline: "none", boxSizing: "border-box",
                            marginBottom: 8,
                          }} />

                        {/* Custom meal optie */}
                        {searchQuery.trim() && (
                          <button onClick={() => assignCustomMeal(date, mt.id, searchQuery)}
                            style={{
                              width: "100%", padding: "8px 12px", borderRadius: 8,
                              border: "1px dashed #D4A574", background: "#D4A57408",
                              color: "#8B6F47", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                              cursor: "pointer", marginBottom: 6, textAlign: "left",
                            }}>
                            + "{searchQuery}" als eigen maaltijd toevoegen
                          </button>
                        )}

                        <div style={{
                          maxHeight: 180, overflowY: "auto",
                          display: "flex", flexDirection: "column", gap: 4,
                        }}>
                          {filteredRecipes.length === 0 && (
                            <p style={{ fontSize: 12, color: "#A89B8A", margin: 0, textAlign: "center", padding: 8 }}>
                              Geen recepten gevonden
                            </p>
                          )}
                          {filteredRecipes.slice(0, 8).map((r) => (
                            <button key={r.id} onClick={() => assignRecipe(date, mt.id, r.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 8,
                                padding: "8px 10px", borderRadius: 8,
                                border: "1px solid #EDE8E0", background: "#FFFCF7",
                                cursor: "pointer", transition: "all 0.15s",
                                textAlign: "left", width: "100%",
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#D4A574"}
                              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#EDE8E0"}
                            >
                              <span style={{ fontSize: 14 }}>
                                {r.cuisine && CUISINE_EMOJIS[r.cuisine] ? CUISINE_EMOJIS[r.cuisine] : "🍽️"}
                              </span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                  fontSize: 13, color: "#3D2E1F", fontWeight: 500,
                                  fontFamily: "'DM Sans', sans-serif",
                                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                }}>{r.title}</div>
                                <div style={{ fontSize: 11, color: "#A89B8A" }}>
                                  {r.cuisine} · {r.prepTime}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const navBtnStyle = {
  width: 36, height: 36, borderRadius: 10,
  border: "1.5px solid #E2DAD0", background: "#FAF7F2",
  color: "#8B6F47", fontSize: 16, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
  transition: "all 0.2s",
};

const CUISINE_EMOJIS = {
  "Italiaans": "🍝", "Aziatisch": "🥢", "Mexicaans": "🌮", "Frans": "🥐",
  "Grieks": "🫒", "Indiaas": "🍛", "Japans": "🍣", "Thais": "🍲",
  "Hollands": "🧇", "Amerikaans": "🍔", "Midden-Oosters": "🧆", "Afrikaans": "🍖",
};
