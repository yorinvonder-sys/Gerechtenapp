import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

const MEAL_TYPES = [
  { id: "ontbijt", label: "Ontbijt", emoji: "🥐" },
  { id: "lunch", label: "Lunch", emoji: "🥗" },
  { id: "diner", label: "Diner", emoji: "🍽️" },
];

const DAY_NAMES = ["Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag", "Zondag"];
const DAY_SHORT = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

// Supermarkt gangpad-indeling: volgorde waarin je door de winkel loopt
const SUPERMARKET_AISLES = {
  albert_heijn: {
    name: "Albert Heijn", color: "#00A0E2", logo: "/images/supermarkets/albert_heijn.webp",
    aisles: [
      { name: "Groente & Fruit", emoji: "🥦", keywords: ["sla", "tomaat", "tomaten", "ui", "uien", "knoflook", "paprika", "wortel", "aardappel", "aardappelen", "champignon", "courgette", "broccoli", "spinazie", "komkommer", "appel", "banaan", "citroen", "limoen", "avocado", "gember", "prei", "selderij", "peterselie", "bieslook", "basilicum", "munt", "koriander", "rozemarijn", "tijm", "dille", "lente-ui", "groente", "fruit", "sjalot", "aubergine", "bloemkool", "boerenkool", "andijvie", "rucola", "mais"] },
      { name: "Brood & Bakkerij", emoji: "🍞", keywords: ["brood", "toast", "tortilla", "wrap", "pita", "naan", "ciabatta", "stokbrood", "croissant", "brioche", "panini"] },
      { name: "Zuivel & Eieren", emoji: "🥛", keywords: ["melk", "kaas", "yoghurt", "room", "slagroom", "boter", "ei", "eieren", "crème fraîche", "mascarpone", "mozzarella", "parmezaan", "parmezan", "feta", "ricotta", "kwark", "cottage cheese", "zuivel", "roomkaas", "cheddar"] },
      { name: "Vlees & Vis", emoji: "🥩", keywords: ["kip", "kipfilet", "gehakt", "rundergehakt", "biefstuk", "spek", "bacon", "worst", "zalm", "garnaal", "garnalen", "tonijn", "kabeljauw", "vis", "vlees", "rundvlees", "varkensvlees", "lamsvlees", "drumstick", "shoarma", "ham", "chorizo", "pancetta"] },
      { name: "Kaas & Vleeswaren", emoji: "🧀", keywords: ["plakken kaas", "vleeswaren", "salami", "prosciutto", "filet americain", "hummus", "pesto", "tapas"] },
      { name: "Pasta, Rijst & Granen", emoji: "🍝", keywords: ["pasta", "spaghetti", "penne", "fusilli", "lasagne", "noodles", "rijst", "basmati", "risotto", "couscous", "quinoa", "bulgur", "havermout", "muesli", "cornflakes", "orzo", "macaroni", "tagliatelle"] },
      { name: "Conserven & Sauzen", emoji: "🥫", keywords: ["tomatenpuree", "tomatenblokjes", "gepelde tomaten", "passata", "sojasaus", "ketjap", "olijfolie", "zonnebloemolie", "azijn", "balsamico", "sriracha", "tabasco", "sambal", "curry", "kokosmelk", "bouillon", "blik", "ingeblikt", "mais blik", "bonen", "kikkererwten", "linzen", "tomatensaus", "pindakaas", "olie"] },
      { name: "Kruiden & Specerijen", emoji: "🌿", keywords: ["zout", "peper", "paprikapoeder", "komijn", "kurkuma", "kaneel", "nootmuskaat", "oregano", "cayenne", "chilipoeder", "knoflookpoeder", "uienpoeder", "kerriepoeder", "kruidenmix", "italiaanse kruiden", "za'atar"] },
      { name: "Bakproducten & Meel", emoji: "🎂", keywords: ["meel", "bloem", "bakpoeder", "gist", "suiker", "poedersuiker", "vanille", "cacao", "chocolade", "maïzena", "paneermeel"] },
      { name: "Chips & Snacks", emoji: "🍿", keywords: ["chips", "noten", "pinda", "cashew", "amandel", "walnoot", "rozijnen", "gedroogd", "crackers", "soepstengels", "popcorn"] },
      { name: "Dranken", emoji: "🥤", keywords: ["water", "sap", "sinaasappelsap", "appelsap", "frisdrank", "cola", "bier", "wijn", "koffie", "thee"] },
      { name: "Diepvries", emoji: "🧊", keywords: ["diepvries", "bevroren", "ijs", "diepvriesgroenten", "friet", "pizza diepvries"] },
      { name: "Overig", emoji: "📦", keywords: [] },
    ],
  },
  jumbo: {
    name: "Jumbo", color: "#FFD700", logo: "/images/supermarkets/jumbo.webp",
    aisles: [
      { name: "AGF (Groente & Fruit)", emoji: "🥦", keywords: ["sla", "tomaat", "tomaten", "ui", "uien", "knoflook", "paprika", "wortel", "aardappel", "aardappelen", "champignon", "courgette", "broccoli", "spinazie", "komkommer", "appel", "banaan", "citroen", "limoen", "avocado", "gember", "prei", "selderij", "peterselie", "bieslook", "basilicum", "munt", "koriander", "rozemarijn", "tijm", "dille", "lente-ui", "groente", "fruit", "sjalot", "aubergine", "bloemkool", "boerenkool", "andijvie", "rucola", "mais"] },
      { name: "Bakkerij", emoji: "🍞", keywords: ["brood", "toast", "tortilla", "wrap", "pita", "naan", "ciabatta", "stokbrood", "croissant", "brioche", "panini"] },
      { name: "Vlees & Vis", emoji: "🥩", keywords: ["kip", "kipfilet", "gehakt", "rundergehakt", "biefstuk", "spek", "bacon", "worst", "zalm", "garnaal", "garnalen", "tonijn", "kabeljauw", "vis", "vlees", "rundvlees", "varkensvlees", "lamsvlees", "drumstick", "shoarma", "ham", "chorizo", "pancetta"] },
      { name: "Kaas & Zuivel", emoji: "🧀", keywords: ["melk", "kaas", "yoghurt", "room", "slagroom", "boter", "ei", "eieren", "crème fraîche", "mascarpone", "mozzarella", "parmezaan", "parmezan", "feta", "ricotta", "kwark", "cottage cheese", "zuivel", "roomkaas", "cheddar", "plakken kaas", "vleeswaren", "salami", "prosciutto", "hummus"] },
      { name: "Houdbaar", emoji: "🥫", keywords: ["pasta", "spaghetti", "penne", "fusilli", "lasagne", "noodles", "rijst", "basmati", "risotto", "couscous", "quinoa", "bulgur", "havermout", "muesli", "cornflakes", "orzo", "macaroni", "tagliatelle", "tomatenpuree", "tomatenblokjes", "gepelde tomaten", "passata", "bouillon", "blik", "bonen", "kikkererwten", "linzen", "mais blik", "pindakaas", "meel", "bloem", "bakpoeder", "gist", "suiker", "vanille", "cacao", "chocolade", "maïzena", "paneermeel"] },
      { name: "Sauzen & Oliën", emoji: "🫒", keywords: ["sojasaus", "ketjap", "olijfolie", "zonnebloemolie", "azijn", "balsamico", "sriracha", "tabasco", "sambal", "kokosmelk", "tomatensaus", "olie", "pesto", "curry"] },
      { name: "Kruiden", emoji: "🌿", keywords: ["zout", "peper", "paprikapoeder", "komijn", "kurkuma", "kaneel", "nootmuskaat", "oregano", "cayenne", "chilipoeder", "knoflookpoeder", "uienpoeder", "kerriepoeder", "kruidenmix", "italiaanse kruiden", "za'atar"] },
      { name: "Snacks & Zoetwaren", emoji: "🍿", keywords: ["chips", "noten", "pinda", "cashew", "amandel", "walnoot", "rozijnen", "gedroogd", "crackers", "popcorn"] },
      { name: "Dranken", emoji: "🥤", keywords: ["water", "sap", "sinaasappelsap", "appelsap", "frisdrank", "cola", "bier", "wijn", "koffie", "thee"] },
      { name: "Diepvries", emoji: "🧊", keywords: ["diepvries", "bevroren", "ijs", "diepvriesgroenten", "friet", "pizza diepvries"] },
      { name: "Overig", emoji: "📦", keywords: [] },
    ],
  },
  lidl: {
    name: "Lidl", color: "#0050AA", logo: "/images/supermarkets/lidl.webp",
    aisles: [
      { name: "Groente & Fruit", emoji: "🥦", keywords: ["sla", "tomaat", "tomaten", "ui", "uien", "knoflook", "paprika", "wortel", "aardappel", "aardappelen", "champignon", "courgette", "broccoli", "spinazie", "komkommer", "appel", "banaan", "citroen", "limoen", "avocado", "gember", "prei", "selderij", "peterselie", "bieslook", "basilicum", "munt", "koriander", "rozemarijn", "tijm", "dille", "lente-ui", "groente", "fruit", "sjalot", "aubergine", "bloemkool", "boerenkool", "andijvie", "rucola", "mais"] },
      { name: "Brood", emoji: "🍞", keywords: ["brood", "toast", "tortilla", "wrap", "pita", "naan", "ciabatta", "stokbrood", "croissant", "brioche", "panini"] },
      { name: "Koeling", emoji: "🥛", keywords: ["melk", "kaas", "yoghurt", "room", "slagroom", "boter", "ei", "eieren", "crème fraîche", "mascarpone", "mozzarella", "parmezaan", "parmezan", "feta", "ricotta", "kwark", "cottage cheese", "zuivel", "roomkaas", "cheddar", "plakken kaas", "vleeswaren", "salami", "hummus", "pesto"] },
      { name: "Vlees & Vis", emoji: "🥩", keywords: ["kip", "kipfilet", "gehakt", "rundergehakt", "biefstuk", "spek", "bacon", "worst", "zalm", "garnaal", "garnalen", "tonijn", "kabeljauw", "vis", "vlees", "rundvlees", "varkensvlees", "lamsvlees", "drumstick", "shoarma", "ham", "chorizo", "pancetta"] },
      { name: "Droog & Conserven", emoji: "🥫", keywords: ["pasta", "spaghetti", "penne", "fusilli", "lasagne", "noodles", "rijst", "basmati", "risotto", "couscous", "quinoa", "bulgur", "havermout", "muesli", "cornflakes", "orzo", "macaroni", "tagliatelle", "tomatenpuree", "tomatenblokjes", "gepelde tomaten", "passata", "bouillon", "blik", "bonen", "kikkererwten", "linzen", "mais blik", "pindakaas", "meel", "bloem", "bakpoeder", "gist", "suiker", "vanille", "cacao", "chocolade", "maïzena", "paneermeel", "sojasaus", "ketjap", "olijfolie", "zonnebloemolie", "azijn", "balsamico", "sriracha", "sambal", "kokosmelk", "tomatensaus", "olie", "curry"] },
      { name: "Kruiden & Specerijen", emoji: "🌿", keywords: ["zout", "peper", "paprikapoeder", "komijn", "kurkuma", "kaneel", "nootmuskaat", "oregano", "cayenne", "chilipoeder", "knoflookpoeder", "uienpoeder", "kerriepoeder", "kruidenmix", "italiaanse kruiden", "za'atar"] },
      { name: "Snacks", emoji: "🍿", keywords: ["chips", "noten", "pinda", "cashew", "amandel", "walnoot", "rozijnen", "gedroogd", "crackers", "popcorn"] },
      { name: "Dranken", emoji: "🥤", keywords: ["water", "sap", "sinaasappelsap", "appelsap", "frisdrank", "cola", "bier", "wijn", "koffie", "thee"] },
      { name: "Diepvries", emoji: "🧊", keywords: ["diepvries", "bevroren", "ijs", "diepvriesgroenten", "friet", "pizza diepvries"] },
      { name: "Overig", emoji: "📦", keywords: [] },
    ],
  },
  aldi: {
    name: "Aldi", color: "#E30613", logo: "/images/supermarkets/aldi.webp",
    aisles: [
      { name: "Groente & Fruit", emoji: "🥦", keywords: ["sla", "tomaat", "tomaten", "ui", "uien", "knoflook", "paprika", "wortel", "aardappel", "aardappelen", "champignon", "courgette", "broccoli", "spinazie", "komkommer", "appel", "banaan", "citroen", "limoen", "avocado", "gember", "prei", "selderij", "peterselie", "bieslook", "basilicum", "munt", "koriander", "rozemarijn", "tijm", "dille", "lente-ui", "groente", "fruit", "sjalot", "aubergine", "bloemkool", "boerenkool", "andijvie", "rucola", "mais"] },
      { name: "Bakkerij", emoji: "🍞", keywords: ["brood", "toast", "tortilla", "wrap", "pita", "naan", "ciabatta", "stokbrood", "croissant", "brioche", "panini"] },
      { name: "Koelvers", emoji: "🥛", keywords: ["melk", "kaas", "yoghurt", "room", "slagroom", "boter", "ei", "eieren", "crème fraîche", "mascarpone", "mozzarella", "parmezaan", "parmezan", "feta", "ricotta", "kwark", "cottage cheese", "zuivel", "roomkaas", "cheddar", "plakken kaas", "vleeswaren", "salami", "hummus", "pesto", "kip", "kipfilet", "gehakt", "rundergehakt", "biefstuk", "spek", "bacon", "worst", "zalm", "garnaal", "garnalen", "tonijn", "kabeljauw", "vis", "vlees", "rundvlees", "varkensvlees", "lamsvlees", "drumstick", "shoarma", "ham", "chorizo", "pancetta"] },
      { name: "Houdbaar", emoji: "🥫", keywords: ["pasta", "spaghetti", "penne", "fusilli", "lasagne", "noodles", "rijst", "basmati", "risotto", "couscous", "quinoa", "bulgur", "havermout", "muesli", "cornflakes", "orzo", "macaroni", "tagliatelle", "tomatenpuree", "tomatenblokjes", "gepelde tomaten", "passata", "bouillon", "blik", "bonen", "kikkererwten", "linzen", "mais blik", "pindakaas", "meel", "bloem", "bakpoeder", "gist", "suiker", "vanille", "cacao", "chocolade", "maïzena", "paneermeel", "sojasaus", "ketjap", "olijfolie", "zonnebloemolie", "azijn", "balsamico", "sriracha", "sambal", "kokosmelk", "tomatensaus", "olie", "curry"] },
      { name: "Kruiden", emoji: "🌿", keywords: ["zout", "peper", "paprikapoeder", "komijn", "kurkuma", "kaneel", "nootmuskaat", "oregano", "cayenne", "chilipoeder", "knoflookpoeder", "uienpoeder", "kerriepoeder", "kruidenmix", "italiaanse kruiden", "za'atar"] },
      { name: "Snacks & Zoetwaren", emoji: "🍿", keywords: ["chips", "noten", "pinda", "cashew", "amandel", "walnoot", "rozijnen", "gedroogd", "crackers", "popcorn"] },
      { name: "Dranken", emoji: "🥤", keywords: ["water", "sap", "sinaasappelsap", "appelsap", "frisdrank", "cola", "bier", "wijn", "koffie", "thee"] },
      { name: "Diepvries", emoji: "🧊", keywords: ["diepvries", "bevroren", "ijs", "diepvriesgroenten", "friet", "pizza diepvries"] },
      { name: "Overig", emoji: "📦", keywords: [] },
    ],
  },
  plus: {
    name: "PLUS", color: "#E87C1E", logo: "/images/supermarkets/plus.webp",
    aisles: [
      { name: "Groente & Fruit", emoji: "🥦", keywords: ["sla", "tomaat", "tomaten", "ui", "uien", "knoflook", "paprika", "wortel", "aardappel", "aardappelen", "champignon", "courgette", "broccoli", "spinazie", "komkommer", "appel", "banaan", "citroen", "limoen", "avocado", "gember", "prei", "selderij", "peterselie", "bieslook", "basilicum", "munt", "koriander", "rozemarijn", "tijm", "dille", "lente-ui", "groente", "fruit", "sjalot", "aubergine", "bloemkool", "boerenkool", "andijvie", "rucola", "mais"] },
      { name: "Brood & Banket", emoji: "🍞", keywords: ["brood", "toast", "tortilla", "wrap", "pita", "naan", "ciabatta", "stokbrood", "croissant", "brioche", "panini"] },
      { name: "Slagerij & Vis", emoji: "🥩", keywords: ["kip", "kipfilet", "gehakt", "rundergehakt", "biefstuk", "spek", "bacon", "worst", "zalm", "garnaal", "garnalen", "tonijn", "kabeljauw", "vis", "vlees", "rundvlees", "varkensvlees", "lamsvlees", "drumstick", "shoarma", "ham", "chorizo", "pancetta"] },
      { name: "Zuivel & Kaas", emoji: "🧀", keywords: ["melk", "kaas", "yoghurt", "room", "slagroom", "boter", "ei", "eieren", "crème fraîche", "mascarpone", "mozzarella", "parmezaan", "parmezan", "feta", "ricotta", "kwark", "cottage cheese", "zuivel", "roomkaas", "cheddar", "plakken kaas", "vleeswaren", "salami", "hummus", "pesto"] },
      { name: "Houdbaar", emoji: "🥫", keywords: ["pasta", "spaghetti", "penne", "fusilli", "lasagne", "noodles", "rijst", "basmati", "risotto", "couscous", "quinoa", "bulgur", "havermout", "muesli", "cornflakes", "orzo", "macaroni", "tagliatelle", "tomatenpuree", "tomatenblokjes", "gepelde tomaten", "passata", "bouillon", "blik", "bonen", "kikkererwten", "linzen", "mais blik", "pindakaas", "meel", "bloem", "bakpoeder", "gist", "suiker", "vanille", "cacao", "chocolade", "maïzena", "paneermeel", "sojasaus", "ketjap", "olijfolie", "zonnebloemolie", "azijn", "balsamico", "sriracha", "sambal", "kokosmelk", "tomatensaus", "olie", "curry"] },
      { name: "Kruiden", emoji: "🌿", keywords: ["zout", "peper", "paprikapoeder", "komijn", "kurkuma", "kaneel", "nootmuskaat", "oregano", "cayenne", "chilipoeder", "knoflookpoeder", "uienpoeder", "kerriepoeder", "kruidenmix", "italiaanse kruiden", "za'atar"] },
      { name: "Dranken", emoji: "🥤", keywords: ["water", "sap", "sinaasappelsap", "appelsap", "frisdrank", "cola", "bier", "wijn", "koffie", "thee"] },
      { name: "Diepvries", emoji: "🧊", keywords: ["diepvries", "bevroren", "ijs", "diepvriesgroenten", "friet", "pizza diepvries"] },
      { name: "Overig", emoji: "📦", keywords: [] },
    ],
  },
  dirk: {
    name: "Dirk", color: "#D4001A", logo: "/images/supermarkets/dirk.webp",
    aisles: [
      { name: "Groente & Fruit", emoji: "🥦", keywords: ["sla", "tomaat", "tomaten", "ui", "uien", "knoflook", "paprika", "wortel", "aardappel", "aardappelen", "champignon", "courgette", "broccoli", "spinazie", "komkommer", "appel", "banaan", "citroen", "limoen", "avocado", "gember", "prei", "selderij", "peterselie", "bieslook", "basilicum", "munt", "koriander", "rozemarijn", "tijm", "dille", "lente-ui", "groente", "fruit", "sjalot", "aubergine", "bloemkool", "boerenkool", "andijvie", "rucola", "mais"] },
      { name: "Bakkerij", emoji: "🍞", keywords: ["brood", "toast", "tortilla", "wrap", "pita", "naan", "ciabatta", "stokbrood", "croissant", "brioche", "panini"] },
      { name: "Vlees, Vis & Zuivel", emoji: "🥩", keywords: ["kip", "kipfilet", "gehakt", "rundergehakt", "biefstuk", "spek", "bacon", "worst", "zalm", "garnaal", "garnalen", "tonijn", "kabeljauw", "vis", "vlees", "rundvlees", "varkensvlees", "lamsvlees", "drumstick", "shoarma", "ham", "chorizo", "pancetta", "melk", "kaas", "yoghurt", "room", "slagroom", "boter", "ei", "eieren", "crème fraîche", "mascarpone", "mozzarella", "parmezaan", "parmezan", "feta", "ricotta", "kwark", "cottage cheese", "zuivel", "roomkaas", "cheddar", "plakken kaas", "vleeswaren", "salami", "hummus", "pesto"] },
      { name: "Houdbaar", emoji: "🥫", keywords: ["pasta", "spaghetti", "penne", "fusilli", "lasagne", "noodles", "rijst", "basmati", "risotto", "couscous", "quinoa", "bulgur", "havermout", "muesli", "cornflakes", "orzo", "macaroni", "tagliatelle", "tomatenpuree", "tomatenblokjes", "gepelde tomaten", "passata", "bouillon", "blik", "bonen", "kikkererwten", "linzen", "mais blik", "pindakaas", "meel", "bloem", "bakpoeder", "gist", "suiker", "vanille", "cacao", "chocolade", "maïzena", "paneermeel", "sojasaus", "ketjap", "olijfolie", "zonnebloemolie", "azijn", "balsamico", "sriracha", "sambal", "kokosmelk", "tomatensaus", "olie", "curry"] },
      { name: "Kruiden", emoji: "🌿", keywords: ["zout", "peper", "paprikapoeder", "komijn", "kurkuma", "kaneel", "nootmuskaat", "oregano", "cayenne", "chilipoeder", "knoflookpoeder", "uienpoeder", "kerriepoeder", "kruidenmix", "italiaanse kruiden", "za'atar"] },
      { name: "Dranken", emoji: "🥤", keywords: ["water", "sap", "sinaasappelsap", "appelsap", "frisdrank", "cola", "bier", "wijn", "koffie", "thee"] },
      { name: "Diepvries", emoji: "🧊", keywords: ["diepvries", "bevroren", "ijs", "diepvriesgroenten", "friet", "pizza diepvries"] },
      { name: "Overig", emoji: "📦", keywords: [] },
    ],
  },
};

function categorizeIngredient(name, aisles) {
  const lower = name.toLowerCase();
  for (let i = 0; i < aisles.length; i++) {
    if (aisles[i].keywords.some(kw => lower.includes(kw))) {
      return { aisle: aisles[i].name, emoji: aisles[i].emoji, order: i };
    }
  }
  // Fallback: "Overig"
  return { aisle: aisles[aisles.length - 1].name, emoji: aisles[aisles.length - 1].emoji, order: aisles.length - 1 };
}

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

export default function WeekPlanner({ user, recipes, pantry = [], onNavigateToRecipes, preferredSupermarket = "", preferredSupermarkets = [] }) {
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
  const [expandedMeal, setExpandedMeal] = useState(null);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [activeStore, setActiveStore] = useState(preferredSupermarket || (preferredSupermarkets.length > 0 ? preferredSupermarkets[0] : ""));
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dates = getWeekDates(0);
    const idx = dates.findIndex(d => d.getTime() === today.getTime());
    return idx >= 0 ? idx : 0;
  });

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  // Reset selectedDayIdx bij week-wissel: vandaag als in de week, anders 0
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const idx = weekDates.findIndex(d => d.getTime() === today.getTime());
    setSelectedDayIdx(idx >= 0 ? idx : 0);
  }, [weekOffset]);

  useEffect(() => {
    loadMealPlans();
    loadSharedUsers();

    // Realtime: luister naar wijzigingen van gedeelde gebruikers
    const channel = supabase
      .channel("meal_plans_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "meal_plans" }, () => {
        loadMealPlans();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [weekOffset]);

  const loadMealPlans = async () => {
    setLoading(true);
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[6]);

    // Haal gedeelde gebruiker-IDs op (bidirectioneel)
    const { data: shares, error: sharesError } = await supabase
      .from("shared_meal_plans")
      .select("owner_id, shared_with")
      .or(`owner_id.eq.${user.id},shared_with.eq.${user.id}`);
    if (sharesError) {
      console.warn("loadSharedMealPlans failed:", sharesError);
    }

    const userIds = new Set([user.id]);
    (shares || []).forEach((s) => {
      userIds.add(s.owner_id);
      userIds.add(s.shared_with);
    });

    if (userIds.size === 0) {
      setMealPlans([]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from("meal_plans")
        .select("*, recipes(*)")
        .gte("date", startDate)
        .lte("date", endDate)
        .in("user_id", [...userIds]);
      setMealPlans(data || []);
    } catch (e) {
      console.warn("loadMealPlans failed:", e);
      setMealPlans([]);
    }
    setLoading(false);
  };

  const loadSharedUsers = async () => {
    // Bidirectioneel: toon zowel mensen die je hebt uitgenodigd als mensen die jou hebben uitgenodigd
    const { data } = await supabase
      .from("shared_meal_plans")
      .select("owner_id, shared_with")
      .or(`owner_id.eq.${user.id},shared_with.eq.${user.id}`);
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
    const meal = getMeal(date, mealType);
    if (!meal) return;
    await supabase
      .from("meal_plans")
      .delete()
      .eq("id", meal.id);
    await loadMealPlans();
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUserSuggestions([]);
      return;
    }
    setSearchingUsers(true);
    const { data } = await supabase.rpc("search_users_by_email", {
      query_input: query.trim(),
    });
    setUserSuggestions(data || []);
    setSearchingUsers(false);
  };

  const handleShareEmailChange = (e) => {
    const val = e.target.value;
    setShareEmail(val);
    setShareStatus("");
    searchUsers(val);
  };

  const shareWithUser = async (targetUserId) => {
    const { error } = await supabase.from("shared_meal_plans").upsert({
      owner_id: user.id,
      shared_with: targetUserId,
    });
    if (error) {
      setShareStatus("Er ging iets mis");
    } else {
      setShareStatus("Gedeeld!");
      setShareEmail("");
      setUserSuggestions([]);
      loadSharedUsers();
      setTimeout(() => setShareStatus(""), 2000);
    }
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
    await shareWithUser(targetUser);
  };

  const getMeal = (date, mealType) => {
    return mealPlans.find(
      (m) => m.date === formatDate(date) && m.meal_type === mealType
    );
  };

  // Boodschappenlijst: verzamel alle ingrediënten van geplande recepten, kruis af met voorraad
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
    const pantryNames = (pantry || []).map((p) => p.name.toLowerCase().trim());
    const supermarket = SUPERMARKET_AISLES[activeStore];
    return Object.values(ingredients)
      .map((item) => {
        const keyLower = item.name.toLowerCase().trim();
        const inPantry = pantryNames.some(
          (pn) => keyLower.includes(pn) || pn.includes(keyLower)
        );
        const category = supermarket
          ? categorizeIngredient(item.name, supermarket.aisles)
          : null;
        return { ...item, inPantry, aisle: category?.aisle, aisleEmoji: category?.emoji, aisleOrder: category?.order ?? 999 };
      })
      .sort((a, b) => {
        if (a.inPantry !== b.inPantry) return a.inPantry ? 1 : -1;
        if (supermarket) {
          if (a.aisleOrder !== b.aisleOrder) return a.aisleOrder - b.aisleOrder;
        }
        return a.name.localeCompare(b.name);
      });
  }, [mealPlans, recipes, pantry, preferredSupermarket]);

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
    <div style={{ paddingBottom: 100 }}>
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
          <div style={{ marginBottom: 12 }}>
            <h4 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#3D2E1F",
              margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8,
            }}>🛒 Boodschappenlijst</h4>
            {/* Winkel-selector */}
            {(preferredSupermarkets.length > 0 || preferredSupermarket) && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {(preferredSupermarkets.length > 0 ? preferredSupermarkets : [preferredSupermarket].filter(Boolean)).map(storeId => {
                  const sm = SUPERMARKET_AISLES[storeId];
                  if (!sm) return null;
                  const isActive = activeStore === storeId;
                  return (
                    <button key={storeId} onClick={() => setActiveStore(storeId)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 12px", borderRadius: 10,
                        border: isActive ? `2px solid ${sm.color}` : "1.5px solid #E2DAD0",
                        background: isActive ? sm.color + "15" : "transparent",
                        cursor: "pointer", transition: "all 0.2s",
                        fontSize: 12, fontWeight: isActive ? 700 : 500,
                        color: isActive ? sm.color : "#8C7E6F",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                      <img src={sm.logo} alt={sm.name} style={{ width: 18, height: 18, objectFit: "contain", borderRadius: 3 }} />
                      {sm.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          {groceryList.length === 0 ? (
            <p style={{ fontSize: 13, color: "#A89B8A", margin: 0 }}>
              Plan recepten in om een boodschappenlijst te genereren.
            </p>
          ) : (
            <div>
              <p style={{
                fontSize: 12, color: "#6B8F5E", fontWeight: 600, margin: "0 0 10px",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                ✓ {groceryList.filter((i) => i.inPantry).length} van {groceryList.length} ingrediënten al in huis
              </p>

              {/* Gegroepeerd per gangpad als supermarkt is geselecteerd */}
              {preferredSupermarket && SUPERMARKET_AISLES[activeStore] ? (() => {
                const toBuy = groceryList.filter(i => !i.inPantry);
                const inStock = groceryList.filter(i => i.inPantry);
                const grouped = {};
                toBuy.forEach(item => {
                  const key = item.aisle || "Overig";
                  if (!grouped[key]) grouped[key] = { emoji: item.aisleEmoji || "📦", order: item.aisleOrder, items: [] };
                  grouped[key].items.push(item);
                });
                const sortedAisles = Object.entries(grouped).sort(([,a], [,b]) => a.order - b.order);
                return (
                  <div>
                    {sortedAisles.map(([aisleName, group]) => (
                      <div key={aisleName} style={{ marginBottom: 12 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                          padding: "4px 0",
                        }}>
                          <span style={{ fontSize: 15 }}>{group.emoji}</span>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: "#8C7E6F",
                            fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}>{aisleName}</span>
                          <span style={{
                            fontSize: 10, color: "#B5A999", fontWeight: 500,
                          }}>({group.items.length})</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {group.items.map(item => (
                            <div key={item.name} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "7px 12px", borderRadius: 8,
                              background: "#FAF7F2", border: "1px solid #EDE8E0",
                            }}>
                              <span style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "#3D2E1F" }}>
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
                      </div>
                    ))}
                    {inStock.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 6, marginBottom: 6,
                          padding: "4px 0",
                        }}>
                          <span style={{ fontSize: 15 }}>✅</span>
                          <span style={{
                            fontSize: 12, fontWeight: 700, color: "#6B8F5E",
                            fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}>Al in huis</span>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {inStock.map(item => (
                            <div key={item.name} style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              padding: "7px 12px", borderRadius: 8,
                              background: "#6B8F5E08", border: "1px solid #6B8F5E30",
                              opacity: 0.7,
                            }}>
                              <span style={{
                                fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                                color: "#6B8F5E", textDecoration: "line-through",
                              }}>✓ {item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })() : (
                /* Geen supermarkt geselecteerd: gewone lijst */
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {groceryList.map((item) => (
                    <div key={item.name} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "8px 12px", borderRadius: 10,
                      background: item.inPantry ? "#6B8F5E08" : "#FAF7F2",
                      border: item.inPantry ? "1px solid #6B8F5E30" : "1px solid #EDE8E0",
                      opacity: item.inPantry ? 0.7 : 1,
                    }}>
                      <span style={{
                        fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                        color: item.inPantry ? "#6B8F5E" : "#3D2E1F",
                        textDecoration: item.inPantry ? "line-through" : "none",
                      }}>
                        {item.inPantry ? "✓ " : ""}{item.name}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {item.inPantry && (
                          <span style={{
                            fontSize: 10, color: "#6B8F5E", fontWeight: 600,
                            background: "#6B8F5E15", padding: "2px 8px", borderRadius: 8,
                          }}>in voorraad</span>
                        )}
                        {item.count > 1 && (
                          <span style={{
                            fontSize: 11, color: "#8B6F47", fontWeight: 600,
                            background: "#8B6F4715", padding: "2px 8px", borderRadius: 8,
                          }}>×{item.count}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {groceryList.some((i) => !i.inPantry) && (
                <button
                  onClick={() => {
                    const sm = SUPERMARKET_AISLES[activeStore];
                    const toBuy = groceryList.filter((i) => !i.inPantry);
                    let text;
                    if (sm) {
                      const grouped = {};
                      toBuy.forEach(item => {
                        const key = item.aisle || "Overig";
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(item);
                      });
                      text = `🛒 Boodschappenlijst (${sm.name})\n\n` +
                        Object.entries(grouped)
                          .map(([aisle, items]) =>
                            `${aisle}:\n` + items.map(i => `  • ${i.name}${i.count > 1 ? ` (×${i.count})` : ""}`).join("\n")
                          ).join("\n\n");
                    } else {
                      text = toBuy.map((i) => `${i.name}${i.count > 1 ? ` (×${i.count})` : ""}`).join("\n");
                    }
                    navigator.clipboard.writeText(text);
                  }}
                  style={{
                    width: "100%", marginTop: 10, padding: "10px", borderRadius: 10,
                    border: "1.5px solid #D4A574", background: "#D4A57410",
                    color: "#8B6F47", fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >📋 Kopieer boodschappenlijst{preferredSupermarket && SUPERMARKET_AISLES[activeStore] ? ` (${SUPERMARKET_AISLES[activeStore].name})` : ""}</button>
              )}

              {!preferredSupermarket && (
                <p style={{
                  fontSize: 11, color: "#A89B8A", margin: "8px 0 0", textAlign: "center",
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  💡 Selecteer je supermarkt in Instellingen voor een slimme gangpad-route
                </p>
              )}
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
          <div style={{ position: "relative", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="email" value={shareEmail} onChange={handleShareEmailChange}
                onKeyDown={(e) => e.key === "Enter" && sharePlanning()}
                placeholder="Zoek op e-mailadres..."
                autoComplete="off"
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
            {userSuggestions.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 56,
                marginTop: 4, borderRadius: 12, overflow: "hidden",
                background: "#FFFCF7", border: "1.5px solid #E2DAD0",
                boxShadow: "0 8px 24px rgba(139,111,71,0.15)",
                zIndex: 10,
              }}>
                {userSuggestions.map((u) => (
                  <button key={u.id} onClick={() => shareWithUser(u.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "10px 14px", border: "none",
                      background: "transparent", cursor: "pointer",
                      textAlign: "left", transition: "background 0.15s",
                      borderBottom: "1px solid #EDE8E0",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "#FAF7F2"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10,
                      background: "linear-gradient(135deg, #D4A574, #C09060)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "#fff", fontSize: 13, fontWeight: 700,
                      fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                    }}>{(u.display_name || u.email)[0].toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {u.display_name && (
                        <div style={{
                          fontSize: 13, color: "#3D2E1F", fontWeight: 600,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{u.display_name}</div>
                      )}
                      <div style={{
                        fontSize: 12, color: "#8C7E6F",
                        fontFamily: "'DM Sans', sans-serif",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>{u.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {searchingUsers && (
              <p style={{ fontSize: 12, color: "#8B6F47", margin: "6px 0 0" }}>Zoeken...</p>
            )}
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
                {sharedUsers.map((s) => {
                  const isOwner = s.owner_id === user.id;
                  const name = isOwner
                    ? (s.profiles_shared?.display_name || "Gebruiker")
                    : (s.profiles_owner?.display_name || "Gebruiker");
                  return (
                    <span key={s.owner_id + s.shared_with} style={{
                      padding: "4px 12px", borderRadius: 12, background: "#6B8F5E15",
                      border: "1px solid #6B8F5E40", color: "#5A7D4E",
                      fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                    }}>{name}</span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Dag-selector */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 12,
        overflowX: "auto", WebkitOverflowScrolling: "touch",
        paddingBottom: 2,
      }}>
        {weekDates.map((date, dayIdx) => {
          const today = isToday(date);
          const isSelected = dayIdx === selectedDayIdx;
          const hasMeals = MEAL_TYPES.some(mt => getMeal(date, mt.id));
          return (
            <button key={formatDate(date)} onClick={() => setSelectedDayIdx(dayIdx)}
              style={{
                flex: 1, minWidth: 44, padding: "8px 4px 10px", borderRadius: 12,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                border: isSelected ? "none" : today ? "1.5px solid #D4A574" : "1px solid #E2DAD0",
                background: isSelected
                  ? "#D4A574"
                  : today ? "#D4A57412" : "transparent",
                cursor: "pointer", transition: "all 0.2s", position: "relative",
              }}
            >
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: isSelected ? "#fff" : today ? "#D4A574" : "#A89B8A",
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
              }}>{DAY_SHORT[dayIdx]}</span>
              <span style={{
                fontSize: 15, fontWeight: 700,
                color: isSelected ? "#fff" : "#3D2E1F",
                fontFamily: "'DM Sans', sans-serif", lineHeight: 1.2,
              }}>{date.getDate()}</span>
              {hasMeals && (
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: isSelected ? "#fff" : "#6B8F5E",
                  display: "block", marginTop: 1,
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Detail-view geselecteerde dag */}
      {(() => {
        const date = weekDates[selectedDayIdx];
        const dayIdx = selectedDayIdx;
        const today = isToday(date);
        return (
          <div style={{
            background: "#FFFCF7",
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
                        if (meal && meal.recipes) {
                          setExpandedMeal(expandedMeal?.id === meal.id ? null : meal);
                          return;
                        }
                        setShowPicker(isPicking ? null : { date: formatDate(date), mealType: mt.id, dateObj: date });
                        setSearchQuery("");
                      }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 12px", borderRadius: 12,
                        background: meal ? "#FAF7F2" : isPicking ? "#8B6F4708" : "transparent",
                        border: isPicking ? "1.5px solid #D4A574" : meal ? "1px solid #EDE8E0" : "1px dashed #E2DAD0",
                        cursor: "pointer",
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
                          <div>
                            <p style={{
                              fontSize: 13, color: "#3D2E1F", margin: "2px 0 0",
                              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                            }}>
                              {meal.recipes?.title || meal.custom_meal}
                            </p>
                            {meal.user_id !== user.id && meal.profiles?.display_name && (
                              <span style={{
                                fontSize: 10, color: "#A89B8A", fontFamily: "'DM Sans', sans-serif",
                              }}>door {meal.profiles.display_name}</span>
                            )}
                          </div>
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

                    {/* Recept detail view */}
                    {expandedMeal?.id === meal?.id && meal?.recipes && (
                      <div style={{
                        marginTop: 8, padding: "16px", borderRadius: 14,
                        background: "#FFFCF7", border: "1.5px solid #D4A574",
                        animation: "fadeIn 0.2s ease",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div>
                            <h4 style={{
                              fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
                              color: "#3D2E1F", margin: "0 0 4px",
                            }}>{meal.recipes.title}</h4>
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                              {meal.recipes.cuisine && (
                                <span style={{ fontSize: 11, color: "#8B6F47", background: "#8B6F4712", borderRadius: 10, padding: "2px 8px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                                  {meal.recipes.cuisine}
                                </span>
                              )}
                              {meal.recipes.prep_time && (
                                <span style={{ fontSize: 11, color: "#6B5D4F", background: "#F0EBE4", borderRadius: 10, padding: "2px 8px", fontFamily: "'DM Sans', sans-serif" }}>
                                  ⏱ {meal.recipes.prep_time}
                                </span>
                              )}
                              {meal.recipes.servings && (
                                <span style={{ fontSize: 11, color: "#6B5D4F", background: "#F0EBE4", borderRadius: 10, padding: "2px 8px", fontFamily: "'DM Sans', sans-serif" }}>
                                  👥 {meal.recipes.servings}p
                                </span>
                              )}
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); setExpandedMeal(null); }}
                            style={{ background: "none", border: "none", fontSize: 16, color: "#A89B8A", cursor: "pointer", padding: "2px 6px" }}>✕</button>
                        </div>

                        {meal.recipes.description && (
                          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6B5D4F", margin: "0 0 14px", lineHeight: 1.5, fontStyle: "italic" }}>
                            {meal.recipes.description}
                          </p>
                        )}

                        {/* Ingrediënten */}
                        {meal.recipes.ingredients?.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#3D2E1F", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                              🥘 Ingrediënten
                            </h5>
                            <ul style={{
                              margin: 0, padding: "0 0 0 18px",
                              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                              lineHeight: 1.8,
                            }}>
                              {meal.recipes.ingredients.map((ing, i) => (
                                <li key={i} style={{ paddingLeft: 4 }}>{ing}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Bereiding */}
                        {meal.recipes.steps?.length > 0 && (
                          <div style={{ marginBottom: 14 }}>
                            <h5 style={{ fontFamily: "'Playfair Display', serif", fontSize: 14, color: "#3D2E1F", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
                              👨‍🍳 Bereiding
                            </h5>
                            <ol style={{
                              margin: 0, padding: "0 0 0 22px",
                              fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3D2E1F",
                              lineHeight: 1.8,
                            }}>
                              {meal.recipes.steps.map((step, i) => (
                                <li key={i} style={{ paddingLeft: 4, marginBottom: 6 }}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Tips */}
                        {meal.recipes.tips && (
                          <div style={{
                            padding: "10px 14px", borderRadius: 10,
                            background: "#F5EDE3", border: "1px solid #EDE8E0",
                            fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6B5D4F",
                            lineHeight: 1.5,
                          }}>
                            💡 <strong>Tip:</strong> {meal.recipes.tips}
                          </div>
                        )}
                      </div>
                    )}

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
      })()}

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
