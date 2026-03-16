import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "./supabaseClient";

// Supermarkt gangpad-indeling (gekopieerd uit WeekPlanner.jsx)
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

export default function ShoppingList({ user, recipes, preferredSupermarket = "albert_heijn" }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [items, setItems] = useState([]);
  const [listId, setListId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const weekStart = useMemo(() => formatDate(weekDates[0]), [weekDates]);

  const supermarket = SUPERMARKET_AISLES[preferredSupermarket] || SUPERMARKET_AISLES.albert_heijn;

  // Laad bestaande lijst bij week-wissel
  useEffect(() => {
    loadList();
  }, [weekStart]);

  // Realtime subscription op shopping_list_items
  useEffect(() => {
    if (!listId) return;

    const channel = supabase
      .channel(`shopping_list_${listId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "shopping_list_items",
        filter: `list_id=eq.${listId}`,
      }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setItems(prev => prev.map(item =>
            item.id === payload.new.id ? { ...item, ...payload.new } : item
          ));
        } else if (payload.eventType === "INSERT") {
          setItems(prev => {
            if (prev.some(item => item.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        } else if (payload.eventType === "DELETE") {
          setItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [listId]);

  const loadList = async () => {
    setLoading(true);
    const { data: list } = await supabase
      .from("shopping_lists")
      .select("id")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (list) {
      setListId(list.id);
      const { data: listItems } = await supabase
        .from("shopping_list_items")
        .select("*")
        .eq("list_id", list.id)
        .order("created_at", { ascending: true });
      setItems(listItems || []);
    } else {
      setListId(null);
      setItems([]);
    }
    setLoading(false);
  };

  const generateList = useCallback(async () => {
    setGenerating(true);

    // 1. Haal meal plans op voor deze week
    const startDate = formatDate(weekDates[0]);
    const endDate = formatDate(weekDates[6]);

    const { data: mealPlans } = await supabase
      .from("meal_plans")
      .select("recipe_id, recipes(title)")
      .eq("user_id", user.id)
      .gte("date", startDate)
      .lte("date", endDate)
      .not("recipe_id", "is", null);

    if (!mealPlans || mealPlans.length === 0) {
      setGenerating(false);
      return;
    }

    // 2. Verzamel en tel ingredienten
    const ingredients = {};
    mealPlans.forEach((mp) => {
      const recipe = recipes.find(r => r.id === mp.recipe_id);
      if (recipe?.ingredients) {
        recipe.ingredients.forEach((ing) => {
          const key = ing.toLowerCase().trim();
          if (!ingredients[key]) {
            ingredients[key] = { name: ing, count: 0, recipeTitles: new Set() };
          }
          ingredients[key].count++;
          ingredients[key].recipeTitles.add(recipe.title);
        });
      }
    });

    // 3. Categoriseer per gangpad
    const categorized = Object.values(ingredients).map(item => {
      const cat = categorizeIngredient(item.name, supermarket.aisles);
      return {
        name: item.count > 1 ? `${item.name} (x${item.count})` : item.name,
        category: cat.aisle,
        recipe_title: [...item.recipeTitles].join(", "),
      };
    });

    // 4. Upsert shopping_list
    const { data: list, error: listError } = await supabase
      .from("shopping_lists")
      .upsert({
        user_id: user.id,
        week_start: weekStart,
        created_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" })
      .select("id")
      .single();

    if (listError || !list) {
      console.warn("Kon boodschappenlijst niet aanmaken:", listError);
      setGenerating(false);
      return;
    }

    // 5. Verwijder oude items
    await supabase
      .from("shopping_list_items")
      .delete()
      .eq("list_id", list.id);

    // 6. Insert nieuwe items
    const newItems = categorized.map(item => ({
      list_id: list.id,
      name: item.name,
      category: item.category,
      checked: false,
      recipe_title: item.recipe_title,
      created_at: new Date().toISOString(),
    }));

    const { data: inserted } = await supabase
      .from("shopping_list_items")
      .insert(newItems)
      .select("*");

    setListId(list.id);
    setItems(inserted || []);
    setGenerating(false);
  }, [weekDates, recipes, user.id, weekStart, supermarket]);

  const toggleItem = useCallback(async (itemId, currentChecked) => {
    // Optimistic update
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, checked: !currentChecked } : item
    ));

    const { error } = await supabase
      .from("shopping_list_items")
      .update({ checked: !currentChecked })
      .eq("id", itemId);

    if (error) {
      // Revert bij fout
      setItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, checked: currentChecked } : item
      ));
    }
  }, []);

  // Groepeer items per gangpad, afgevinkt naar beneden
  const groupedItems = useMemo(() => {
    const aisleMap = {};
    const aisles = supermarket.aisles;

    items.forEach(item => {
      const cat = item.category || "Overig";
      if (!aisleMap[cat]) {
        const aisleData = aisles.find(a => a.name === cat);
        const order = aisleData ? aisles.indexOf(aisleData) : aisles.length - 1;
        aisleMap[cat] = {
          emoji: aisleData?.emoji || "📦",
          order,
          unchecked: [],
          checked: [],
        };
      }
      if (item.checked) {
        aisleMap[cat].checked.push(item);
      } else {
        aisleMap[cat].unchecked.push(item);
      }
    });

    return Object.entries(aisleMap)
      .sort(([, a], [, b]) => a.order - b.order);
  }, [items, supermarket]);

  const checkedCount = items.filter(i => i.checked).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    const months = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} - ${end.getDate()} ${months[start.getMonth()]}`;
    }
    return `${start.getDate()} ${months[start.getMonth()]} - ${end.getDate()} ${months[end.getMonth()]}`;
  })();

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Header met supermarkt */}
      <div style={{
        background: "#FFFCF7", borderRadius: 24, padding: "20px 24px",
        boxShadow: "0 4px 28px rgba(139,111,71,0.10)", marginBottom: 16,
        border: "1px solid #EDE8E0",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12,
        }}>
          <h3 style={{
            fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#3D2E1F",
            margin: 0, display: "flex", alignItems: "center", gap: 8,
          }}>Boodschappenlijst</h3>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: supermarket.color + "12", padding: "5px 12px",
            borderRadius: 12, border: `1px solid ${supermarket.color}30`,
          }}>
            <img
              src={supermarket.logo}
              alt={supermarket.name}
              style={{ width: 20, height: 20, objectFit: "contain" }}
            />
            <span style={{
              fontSize: 12, fontWeight: 700, color: supermarket.color,
              fontFamily: "'DM Sans', sans-serif",
            }}>{supermarket.name}</span>
          </div>
        </div>

        {/* Week navigatie */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
        }}>
          <button onClick={() => setWeekOffset(weekOffset - 1)} style={navBtnStyle}>
            <span style={{ fontSize: 16 }}>&#8592;</span>
          </button>
          <span style={{
            fontSize: 14, fontWeight: 600, color: "#8C7E6F",
            fontFamily: "'DM Sans', sans-serif",
          }}>{weekLabel}</span>
          <button onClick={() => setWeekOffset(weekOffset + 1)} style={navBtnStyle}>
            <span style={{ fontSize: 16 }}>&#8594;</span>
          </button>
        </div>

        {weekOffset !== 0 && (
          <button onClick={() => setWeekOffset(0)} style={{
            width: "100%", padding: "8px", borderRadius: 10,
            border: "1px solid #E2DAD0", background: "transparent",
            color: "#8B6F47", fontSize: 12, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", cursor: "pointer",
            marginBottom: 12,
          }}>Naar deze week</button>
        )}

        {/* Genereer knop */}
        <button
          onClick={generateList}
          disabled={generating}
          style={{
            width: "100%", padding: "14px", borderRadius: 14,
            border: "none",
            background: generating
              ? "#E2DAD0"
              : "linear-gradient(135deg, #6B8F5E 0%, #5A7D4E 100%)",
            color: generating ? "#8C7E6F" : "#fff",
            fontSize: 15, fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            cursor: generating ? "not-allowed" : "pointer",
            boxShadow: generating ? "none" : "0 4px 16px rgba(107,143,94,0.30)",
            transition: "all 0.2s",
          }}
        >
          {generating ? "Bezig met genereren..." : "Genereer boodschappenlijst"}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          textAlign: "center", padding: 40, color: "#8C7E6F",
          fontSize: 14, fontFamily: "'DM Sans', sans-serif",
        }}>Laden...</div>
      )}

      {/* Lijst content */}
      {!loading && items.length > 0 && (
        <div style={{
          background: "#FFFCF7", borderRadius: 20, padding: "20px 24px",
          boxShadow: "0 4px 28px rgba(139,111,71,0.10)",
          border: "1px solid #EDE8E0",
        }}>
          {/* Voortgangsbalk */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8,
            }}>
              <span style={{
                fontSize: 13, fontWeight: 600, color: "#3D2E1F",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {checkedCount} van {totalCount} afgevinkt
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: progressPct === 100 ? "#6B8F5E" : "#8B6F47",
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {progressPct}%
              </span>
            </div>
            <div style={{
              height: 8, borderRadius: 4,
              background: "#FAF7F2", overflow: "hidden",
              border: "1px solid #EDE8E0",
            }}>
              <div style={{
                height: "100%", borderRadius: 4,
                width: `${progressPct}%`,
                background: progressPct === 100
                  ? "linear-gradient(90deg, #6B8F5E, #5A7D4E)"
                  : "linear-gradient(90deg, #D4A574, #8B6F47)",
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Items per gangpad */}
          {groupedItems.map(([aisleName, group]) => {
            const hasUnchecked = group.unchecked.length > 0;
            const hasChecked = group.checked.length > 0;
            if (!hasUnchecked && !hasChecked) return null;

            return (
              <div key={aisleName} style={{ marginBottom: 16 }}>
                {/* Gangpad header */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  marginBottom: 8, padding: "4px 0",
                }}>
                  <span style={{ fontSize: 16 }}>{group.emoji}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, color: "#8C7E6F",
                    fontFamily: "'DM Sans', sans-serif", textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>{aisleName}</span>
                  <span style={{
                    fontSize: 10, color: "#B5A999", fontWeight: 500,
                  }}>({group.unchecked.length + group.checked.length})</span>
                </div>

                {/* Niet-afgevinkte items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {group.unchecked.map(item => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                    />
                  ))}

                  {/* Afgevinkte items (doorgestreept, onder) */}
                  {group.checked.map(item => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={toggleItem}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {/* Alles afgevinkt bericht */}
          {progressPct === 100 && (
            <div style={{
              textAlign: "center", padding: "16px 0 4px",
              fontSize: 14, color: "#6B8F5E", fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Alles afgevinkt! Fijne maaltijden deze week.
            </div>
          )}
        </div>
      )}

      {/* Lege state */}
      {!loading && items.length === 0 && !generating && (
        <div style={{
          background: "#FFFCF7", borderRadius: 20, padding: "32px 24px",
          boxShadow: "0 4px 28px rgba(139,111,71,0.10)",
          border: "1px solid #EDE8E0", textAlign: "center",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
          <p style={{
            fontSize: 15, color: "#3D2E1F", fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", margin: "0 0 6px",
          }}>Nog geen boodschappenlijst</p>
          <p style={{
            fontSize: 13, color: "#A89B8A", margin: 0,
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
          }}>
            Plan recepten in je weekplanner en druk op "Genereer" om automatisch een boodschappenlijst te maken.
          </p>
        </div>
      )}
    </div>
  );
}

function ShoppingItem({ item, onToggle }) {
  return (
    <button
      onClick={() => onToggle(item.id, item.checked)}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        background: item.checked ? "#FAF7F2" : "#FFFCF7",
        border: item.checked ? "1px solid #E2DAD0" : "1px solid #EDE8E0",
        cursor: "pointer", width: "100%",
        opacity: item.checked ? 0.6 : 1,
        transition: "all 0.2s",
        textAlign: "left",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 22, height: 22, borderRadius: 6, flexShrink: 0,
        border: item.checked ? "2px solid #6B8F5E" : "2px solid #D4C5B2",
        background: item.checked ? "#6B8F5E" : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s",
      }}>
        {item.checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>

      {/* Item tekst */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 14, color: item.checked ? "#A89B8A" : "#3D2E1F",
          fontWeight: 500,
          textDecoration: item.checked ? "line-through" : "none",
          display: "block",
        }}>
          {item.name}
        </span>
        {item.recipe_title && (
          <span style={{
            fontSize: 11, color: "#B5A999", fontWeight: 400,
            display: "block", marginTop: 2,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {item.recipe_title}
          </span>
        )}
      </div>
    </button>
  );
}

const navBtnStyle = {
  width: 36, height: 36, borderRadius: 10,
  border: "1.5px solid #E2DAD0", background: "transparent",
  color: "#8C7E6F", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 16, fontFamily: "'DM Sans', sans-serif",
};
