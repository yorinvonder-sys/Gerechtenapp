-- Enrich public_recipes with smart tags based on ingredients, title, description

-- MEAL TYPE based on tags and title
UPDATE public_recipes SET meal_type = 'ontbijt' WHERE
  title ILIKE '%ontbijt%' OR title ILIKE '%pannenkoek%' OR title ILIKE '%omelet%'
  OR title ILIKE '%granola%' OR title ILIKE '%muesli%' OR title ILIKE '%smoothie%'
  OR title ILIKE '%crêpe%' OR title ILIKE '%toast%' OR title ILIKE '%porridge%'
  OR 'ontbijt' = ANY(tags) OR 'breakfast' = ANY(tags);

UPDATE public_recipes SET meal_type = 'lunch' WHERE
  (title ILIKE '%salade%' OR title ILIKE '%sandwich%' OR title ILIKE '%wrap%'
  OR title ILIKE '%soep%' OR title ILIKE '%broodje%' OR title ILIKE '%quiche%'
  OR 'lunch' = ANY(tags) OR 'salade' = ANY(tags))
  AND meal_type = 'diner';

UPDATE public_recipes SET meal_type = 'dessert' WHERE
  title ILIKE '%dessert%' OR title ILIKE '%taart%' OR title ILIKE '%cake%'
  OR title ILIKE '%pudding%' OR title ILIKE '%ijs%' OR title ILIKE '%mousse%'
  OR title ILIKE '%brownie%' OR title ILIKE '%cookie%' OR title ILIKE '%baklava%'
  OR title ILIKE '%tiramisu%' OR title ILIKE '%crème%' OR title ILIKE '%flan%'
  OR title ILIKE '%mochi%' OR title ILIKE '%cheesecake%' OR title ILIKE '%sorbet%'
  OR 'dessert' = ANY(tags);

UPDATE public_recipes SET meal_type = 'snack' WHERE
  (title ILIKE '%snack%' OR title ILIKE '%hapje%' OR title ILIKE '%bitterbal%'
  OR title ILIKE '%kroket%' OR title ILIKE '%samosa%' OR title ILIKE '%loempia%'
  OR title ILIKE '%nacho%' OR title ILIKE '%dip%' OR title ILIKE '%chips%'
  OR 'snack' = ANY(tags) OR 'street food' = ANY(tags) OR 'antipasti' = ANY(tags)
  OR 'mezze' = ANY(tags) OR 'tapas' = ANY(tags) OR 'dim sum' = ANY(tags))
  AND meal_type = 'diner';

-- DIFFICULTY based on steps count and prep time
UPDATE public_recipes SET difficulty = 'beginner' WHERE
  (array_length(steps, 1) <= 4
  OR prep_time ILIKE '%10 min%' OR prep_time ILIKE '%15 min%' OR prep_time ILIKE '%5 min%');

UPDATE public_recipes SET difficulty = 'gevorderd' WHERE
  (array_length(steps, 1) >= 8
  OR prep_time ILIKE '%90%' OR prep_time ILIKE '%120%' OR prep_time ILIKE '%2 uur%'
  OR prep_time ILIKE '%3 uur%');

-- DIETARY tags based on ingredients
-- Vegetarisch: no meat/fish keywords
UPDATE public_recipes SET dietary = array_append(dietary, 'vegetarisch')
WHERE NOT EXISTS (
  SELECT 1 FROM unnest(ingredients) ing
  WHERE ing ILIKE ANY(ARRAY['%kip%','%kipfilet%','%rundvlees%','%gehakt%','%varkensvlees%',
    '%spek%','%bacon%','%ham%','%worst%','%salami%','%lam%','%kalf%','%eend%',
    '%vis%','%zalm%','%tonijn%','%garnaal%','%garnalen%','%mosselen%','%krab%',
    '%inktvis%','%octopus%','%ansjovis%','%sardine%','%makreel%','%kabeljauw%',
    '%pangasius%','%tilapia%','%forel%','%haring%','%oesters%','%kreeft%',
    '%chicken%','%beef%','%pork%','%lamb%','%duck%','%fish%','%shrimp%','%prawn%',
    '%meat%','%vlees%','%biefstuk%','%steak%','%spareribs%','%pulled pork%',
    '%pancetta%','%chorizo%','%merguez%','%saucijs%','%braadworst%'])
) AND NOT 'vegetarisch' = ANY(dietary);

-- Veganistisch: no animal products at all
UPDATE public_recipes SET dietary = array_append(dietary, 'veganistisch')
WHERE NOT EXISTS (
  SELECT 1 FROM unnest(ingredients) ing
  WHERE ing ILIKE ANY(ARRAY['%kip%','%rundvlees%','%gehakt%','%varkensvlees%',
    '%vis%','%zalm%','%garnaal%','%ei%','%eieren%','%kaas%','%melk%','%room%',
    '%boter%','%yoghurt%','%crème%','%ricotta%','%mozzarella%','%parmezaan%',
    '%feta%','%honing%','%spek%','%bacon%','%ham%','%worst%','%vlees%',
    '%biefstuk%','%steak%','%chicken%','%beef%','%pork%','%cheese%','%cream%',
    '%butter%','%egg%','%milk%','%honey%','%lam%','%eend%','%duck%','%lamb%',
    '%slagroom%','%kwark%','%mascarpone%','%gruyère%','%cheddar%','%brie%'])
) AND NOT 'veganistisch' = ANY(dietary);

-- Glutenvrij: no gluten keywords
UPDATE public_recipes SET dietary = array_append(dietary, 'glutenvrij')
WHERE NOT EXISTS (
  SELECT 1 FROM unnest(ingredients) ing
  WHERE ing ILIKE ANY(ARRAY['%bloem%','%meel%','%pasta%','%spaghetti%','%penne%',
    '%fusilli%','%lasagne%','%noedel%','%brood%','%toast%','%pita%','%naan%',
    '%tortilla%','%wrap%','%panko%','%paneermeel%','%flour%','%couscous%',
    '%bulgur%','%gerst%','%rogge%','%tarwe%','%croissant%','%brioche%',
    '%baguette%','%ciabatta%','%focaccia%','%udon%','%ramen%','%soba%'])
) AND NOT 'glutenvrij' = ANY(dietary);

-- SEASON tags
UPDATE public_recipes SET season = ARRAY['lente','zomer'] WHERE
  array_to_string(ingredients, ' ') ILIKE ANY(ARRAY['%aardbei%','%asperge%','%courgette%',
    '%tomaat%','%basilicum%','%watermeloen%','%perzik%','%mango%','%avocado%'])
  OR title ILIKE ANY(ARRAY['%salade%','%gazpacho%','%carpaccio%','%ceviche%','%poke%']);

UPDATE public_recipes SET season = ARRAY['herfst','winter'] WHERE
  array_to_string(ingredients, ' ') ILIKE ANY(ARRAY['%pompoen%','%kastanje%','%boerenkool%',
    '%spruitjes%','%rode kool%','%winterwortel%','%knolselderij%','%pastinaak%'])
  OR title ILIKE ANY(ARRAY['%stamppot%','%stoof%','%erwtensoep%','%hutspot%','%ragout%',
    '%stoofvlees%','%goulash%','%chili%'])
  AND season = '{}';

UPDATE public_recipes SET season = ARRAY['lente','zomer','herfst','winter']
WHERE season = '{}';

-- CALORIES estimate based on meal type and cuisine
UPDATE public_recipes SET calories_estimate =
  CASE
    WHEN meal_type = 'snack' THEN 150 + (random() * 200)::int
    WHEN meal_type = 'ontbijt' THEN 250 + (random() * 250)::int
    WHEN meal_type = 'lunch' THEN 350 + (random() * 300)::int
    WHEN meal_type = 'dessert' THEN 200 + (random() * 300)::int
    ELSE 450 + (random() * 350)::int
  END
WHERE calories_estimate IS NULL;

-- Add extra descriptive tags based on content
UPDATE public_recipes SET tags = array_cat(tags, ARRAY['snel'])
WHERE (prep_time ILIKE '%10%' OR prep_time ILIKE '%15%' OR prep_time ILIKE '%5 min%')
  AND NOT 'snel' = ANY(tags);

UPDATE public_recipes SET tags = array_cat(tags, ARRAY['comfort food'])
WHERE (title ILIKE '%comfort%' OR title ILIKE '%mac and cheese%' OR title ILIKE '%lasagne%'
  OR title ILIKE '%stamppot%' OR title ILIKE '%stoofvlees%' OR title ILIKE '%gratin%'
  OR title ILIKE '%ovenschotel%' OR title ILIKE '%risotto%' OR title ILIKE '%curry%')
  AND NOT 'comfort food' = ANY(tags);

UPDATE public_recipes SET tags = array_cat(tags, ARRAY['feestelijk'])
WHERE (title ILIKE '%feest%' OR title ILIKE '%kerst%' OR title ILIKE '%gala%'
  OR title ILIKE '%biefstuk%' OR title ILIKE '%wellington%' OR title ILIKE '%tournedos%'
  OR title ILIKE '%kreeft%' OR title ILIKE '%oesters%')
  AND NOT 'feestelijk' = ANY(tags);

UPDATE public_recipes SET tags = array_cat(tags, ARRAY['kindvriendelijk'])
WHERE (title ILIKE '%pannenkoek%' OR title ILIKE '%pizza%' OR title ILIKE '%nuggets%'
  OR title ILIKE '%mac and cheese%' OR title ILIKE '%pancake%' OR title ILIKE '%friet%'
  OR title ILIKE '%burger%' OR title ILIKE '%pasta%')
  AND NOT 'kindvriendelijk' = ANY(tags);

UPDATE public_recipes SET tags = array_cat(tags, ARRAY['budget'])
WHERE (title ILIKE '%budget%' OR title ILIKE '%goedkoop%' OR title ILIKE '%simpel%'
  OR array_length(ingredients, 1) <= 5)
  AND NOT 'budget' = ANY(tags);
