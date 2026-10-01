// One image fallback for the public site and HTML dashboards.
const symbols = [
  [/tomato/i, "🍅"], [/potato/i, "🥔"], [/onion/i, "🧅"],
  [/carrot/i, "🥕"], [/egg/i, "🥚"], [/milk|dairy/i, "🥛"],
  [/bread|bun|bakery|baked/i, "🍞"], [/honey/i, "🍯"],
  [/apple/i, "🍎"], [/banana/i, "🍌"], [/mango/i, "🥭"],
  [/orange|citrus/i, "🍊"], [/lemon/i, "🍋"], [/strawberry/i, "🍓"],
  [/corn|rice|wheat|grain/i, "🌾"], [/chicken|poultry/i, "🍗"],
  [/fish/i, "🐟"], [/meat|beef|mutton/i, "🥩"],
  [/pepper|chill/i, "🌶️"], [/cucumber|vegetable|produce|greens/i, "🥬"],
  [/cheese|butter/i, "🧀"], [/oil|pickle|pantry/i, "🫙"],
  [/fruit/i, "🍇"],
];
const xml = value => String(value || "").replace(/[&<>"']/g, char =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[char]);

export function imageFallback(name, kind = "product", category = "") {
  const label = String(name || (kind === "farmer" ? "Local stall" : kind === "market" ? "Local market" : "Fresh product")).slice(0, 32);
  const hue = [...label].reduce((sum, char) => sum + char.codePointAt(0), 0) % 55 + 95;
  const symbol = kind === "farmer" ? "🏪" : kind === "market" ? "🏬" :
    symbols.find(([pattern]) => pattern.test(label))?.[1] ||
    symbols.find(([pattern]) => pattern.test(category))?.[1] || "🌿";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520"><rect width="800" height="520" fill="hsl(${hue} 35% 87%)"/><circle cx="400" cy="230" r="147" fill="hsl(${hue} 34% 95%)"/><text x="400" y="278" font-size="142" text-anchor="middle">${symbol}</text><text x="400" y="444" fill="#174d3b" font-family="Arial,sans-serif" font-size="35" font-weight="bold" text-anchor="middle">${xml(label)}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Old generic produce photo was saved for unrelated products; replace it on display.
export function imageSource(src, name, kind = "product", category = "") {
  return src && !String(src).includes("/photos/1300972/")
    ? src : imageFallback(name, kind, category);
}

export function imageProps(src, name, kind = "product", category = "") {
  const fallback = imageFallback(name, kind, category);
  return {
    src: imageSource(src, name, kind, category),
    onError: event => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; },
  };
}
