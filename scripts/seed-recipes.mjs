// Recipe seed script - generates recipes via Gemini and inserts into Supabase
// Usage: node scripts/seed-recipes.mjs <cuisine> <batch_count>
// Example: node scripts/seed-recipes.mjs "Italiaans" 15

const SUPABASE_URL = "https://utaadpulqrsubpfkwira.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

const cuisine = process.argv[2] || "Italiaans";
const batchCount = parseInt(process.argv[3] || "30");
const recipesPerBatch = 10;

async function generateBatch(cuisine, batchNum) {
  const subcategories = {
    "Italiaans": ["pasta", "risotto", "pizza", "antipasti", "zeevruchten", "vlees", "soep", "salade", "brood", "dessert"],
    "Aziatisch": ["wok", "curry", "noedels", "dim sum", "sushi", "rijst", "soep", "salade", "street food", "dessert"],
    "Mexicaans": ["taco", "burrito", "enchilada", "quesadilla", "soep", "salade", "rijst", "bonen", "street food", "dessert"],
    "Frans": ["soep", "quiche", "vlees", "vis", "salade", "saus", "brood", "kaas", "dessert", "bistro"],
    "Grieks": ["mezze", "vlees", "vis", "salade", "soep", "brood", "kaas", "gegrild", "rijst", "dessert"],
    "Indiaas": ["curry", "dal", "biryani", "tandoori", "naan", "chutney", "samosa", "soep", "rijst", "dessert"],
    "Japans": ["sushi", "ramen", "udon", "tempura", "teriyaki", "donburi", "gyoza", "soep", "salade", "dessert"],
    "Thais": ["curry", "wok", "noedels", "soep", "salade", "rijst", "street food", "gegrild", "saus", "dessert"],
    "Hollands": ["stamppot", "erwtensoep", "pannenkoek", "kroket", "hutspot", "gehakt", "vis", "soep", "ovenschotel", "dessert"],
    "Amerikaans": ["burger", "bbq", "mac and cheese", "steak", "sandwich", "salade", "soep", "breakfast", "comfort food", "dessert"],
    "Midden-Oosters": ["hummus", "falafel", "kebab", "shawarma", "tabbouleh", "rijst", "soep", "brood", "gegrild", "dessert"],
    "Afrikaans": ["stew", "curry", "gegrild", "rijst", "bonen", "groenten", "brood", "soep", "street food", "dessert"],
    "Koreaans": ["bibimbap", "kimchi", "bulgogi", "japchae", "tteokbokki", "soep", "gegrild", "rijst", "pancake", "dessert"],
    "Spaans": ["tapas", "paella", "tortilla", "gazpacho", "croquetas", "vis", "vlees", "salade", "rijst", "dessert"],
    "Vietnamees": ["pho", "bun", "banh mi", "loempia", "curry", "noedels", "rijst", "soep", "salade", "dessert"],
  };

  const subs = subcategories[cuisine] || ["hoofdgerecht", "bijgerecht", "soep", "salade", "snack", "dessert", "ontbijt", "lunch", "diner", "street food"];
  const subcat = subs[batchNum % subs.length];

  const prompt = `Genereer precies ${recipesPerBatch} UNIEKE ${cuisine}e recepten in het Nederlands, specifiek gericht op ${subcat}. Zorg voor veel variatie in ingrediënten en bereidingswijze. Elk recept moet realistisch en smakelijk zijn.

Antwoord ALLEEN met valid JSON array, zonder markdown of backticks:
[{"title":"naam","description":"korte beschrijving in 1 zin","cuisine":"${cuisine}","prepTime":"bereidingstijd (bijv. 30 min)","servings":4,"ingredients":["ingrediënt 1 met hoeveelheid","ingrediënt 2"],"steps":["stap 1","stap 2"],"tips":"optionele tip","tags":["${subcat}"],"imageQuery":"specific english search term for this dish photo"}]`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.95, maxOutputTokens: 16384, responseMimeType: "application/json" },
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.candidates?.[0]?.content?.parts?.filter(p => !p.thought).map(p => p.text || "").join("") || "";
    const recipes = JSON.parse(text.replace(/```json|```/g, "").trim());

    if (!Array.isArray(recipes)) throw new Error("Not an array");
    return recipes;
  } catch (err) {
    console.error(`  [FOUT] Batch ${batchNum} voor ${cuisine}/${subcat}: ${err.message}`);
    return [];
  }
}

async function insertRecipes(recipes) {
  const rows = recipes.map(r => ({
    title: r.title,
    description: r.description,
    cuisine: r.cuisine,
    prep_time: r.prepTime,
    servings: r.servings || 4,
    ingredients: r.ingredients || [],
    steps: r.steps || [],
    tips: r.tips || "",
    tags: r.tags || [],
    image_query: r.imageQuery || r.title,
  }));

  const res = await fetch(`${SUPABASE_URL}/rest/v1/public_recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_SERVICE_KEY,
      "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`  [DB FOUT] ${err}`);
    return 0;
  }
  return rows.length;
}

async function main() {
  console.log(`🍳 Start: ${batchCount} batches van ${recipesPerBatch} ${cuisine}e recepten...`);
  let total = 0;

  for (let i = 0; i < batchCount; i++) {
    process.stdout.write(`  Batch ${i + 1}/${batchCount}... `);
    const recipes = await generateBatch(cuisine, i);
    if (recipes.length > 0) {
      const inserted = await insertRecipes(recipes);
      total += inserted;
      console.log(`✅ ${inserted} recepten toegevoegd (totaal: ${total})`);
    } else {
      console.log(`⚠️  Geen recepten gegenereerd`);
    }
    // Small delay to avoid rate limits
    if (i < batchCount - 1) await new Promise(r => setTimeout(r, 1000));
  }

  console.log(`\n🎉 Klaar! ${total} ${cuisine}e recepten toegevoegd.`);
}

main().catch(console.error);
