// Category and product names determine the allowed stock units.

const categoryUnits = {
    produce: ["kg", "g", "bunch", "pack", "box"],
  
    dairy: ["litre", "ml", "kg", "dozen", "tray", "pack"],
  
    bakery: ["pack", "piece", "loaf", "box"],
  
    pantry: ["jar", "bottle", "kg", "pack"],
  
    meat: ["kg", "g", "pack"],
  
    condiments: ["jar", "bottle", "pack"],
  
    grains: ["kg", "g", "pack"],
  };
  
  export function unitsFor(category = "", name = "") {
  
    if (/\beggs?\b/i.test(name)) return ["dozen", "tray", "piece"];
  
    if (/\bmilk\b/i.test(name)) return ["litre", "ml", "bottle"];
  
    if (/\btomato(?:es)?\b/i.test(name)) return ["kg", "g"];
  
    if (/vegetable|fruit|produce/i.test(category)) return categoryUnits.produce;
  
    if (/dairy|egg/i.test(category)) return categoryUnits.dairy;
  
    if (/bak|bread/i.test(category)) return categoryUnits.bakery;
  
    if (/honey|pantry/i.test(category)) return categoryUnits.pantry;
  
    if (/meat|poultry|fish/i.test(category)) return categoryUnits.meat;
  
    if (/condiment|spice/i.test(category)) return categoryUnits.condiments;
  
    if (/grain|pulse|rice/i.test(category)) return categoryUnits.grains;
  
    return [
      "kg",
      "g",
      "litre",
      "ml",
      "piece",
      "dozen",
      "pack",
      "bunch",
      "box",
      "jar",
      "bottle",
      "tray",
    ];
  }