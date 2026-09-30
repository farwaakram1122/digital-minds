// Customer pages: browse listings, place pickup orders and track activity.
import {
  $,
  api,
  guard,
  shell,
  active,
  heading,
  stat,
  table,
  badge,
  esc,
  money,
  date,
  field,
  textarea,
  select,
  modal,
  toast,
  confirmAction,
  empty,
  short,
  mapEmbed,
  hero,
  barChart,
  donut,
  notificationsPage,
  ratingLabel,
  reviewRatings,
  imageTag,
} from "./core.js";
import { messagesPage } from "./messages.js";
const nav = [
  ["overview", "Overview", "◫"],
  ["markets", "Markets", "⌖"],
  ["farmers", "Farmers", "♧"],
  ["products", "Browse products", "▣"],
  ["cart", "Cart & pickup", "◈"],
  ["orders", "My orders", "▤"],
  ["favorites", "Favorites", "♡"],
  ["notifications", "Notifications", "◉"],
  ["messages", "Messages", "✉"],
  ["profile", "My profile", "♙"],
];
let user = await guard("customer"),
  page = "overview",
  cart = JSON.parse(sessionStorage.getItem("ml_panel_cart") || "{}");
const content = $("#content");
const saveCart = () =>
  sessionStorage.setItem("ml_panel_cart", JSON.stringify(cart));
async function show(next) {
  page = nav.some(([key]) => key === next) ? next : "overview";
  active(page, nav.find(([key]) => key === page)[1]);
  content.innerHTML = '<div class="card empty">Loading…</div>';
  try {
    await views[page]();
  } catch (err) {
    content.innerHTML = `<div class="error">${esc(err.message)}</div>`;
  }
}
const views = {
  overview,
  markets,
  farmers,
  products,
  cart: cartPage,
  orders,
  favorites,
  notifications: () => notificationsPage(content, () => show("notifications")),
  messages: () => messagesPage(user, content, () => show("messages")),
  profile,
};
const fav = (type, id) =>
  user.favorites?.[type]?.map(String).includes(String(id));
async function favorite(type, id) {
  try {
    user.favorites = await api(`/favorites/${type}/${id}`, { method: "POST" });
    toast("Favorites updated");
    show(page);
  } catch (err) {
    toast(err.message, true);
  }
}
async function overview() {
  const [orders, alerts, announcements, products] = await Promise.all([
    api("/orders"),
    api("/notifications"),
    api("/announcements"),
    api("/products"),
  ]);
  const upcoming = orders.filter((o) =>
    [
      "placed",
      "accepted",
      "packing",
      "packed",
      "out_for_delivery",
      "ready",
    ].includes(o.status),
  );
  const labels = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return d.toLocaleString("en", { month: "short" });
  });
  const counts = labels.map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return orders.filter((o) => {
      const x = new Date(o.createdAt || o.pickupDate);
      return (
        x.getMonth() === d.getMonth() && x.getFullYear() === d.getFullYear()
      );
    }).length;
  });
  content.innerHTML =
    heading(
      "YOUR LOCAL MARKET",
      "Customer dashboard",
      "Plan your market visit and keep track of every pickup.",
    ) +
    hero(
      "FRESH, LOCAL, SIMPLE",
      `Welcome back, ${user.name}.`,
      "Discover what local farmers have this week, reserve your favorites and pay when you collect.",
      "Explore products",
      "products",
    ) +
    `<div class="grid stats">${stat("My orders", orders.length, "Reservation history")}${stat("Ready for pickup", orders.filter((o) => o.status === "ready").length, "Collect at market")}${stat("Fresh products", products.length, "Across all farmers")}${stat("Unread alerts", alerts.filter((x) => !x.read).length, "New activity")}</div>` +
    `<div class="dashboard-grid"><div class="card"><div class="section-head"><h2>My market activity</h2><small>Last 6 months</small></div>${barChart(counts, labels)}</div><div class="card"><div class="section-head"><h2>Upcoming pickups</h2></div>${
      upcoming
        .slice(0, 4)
        .map(
          (o) =>
            `<div class="activity-line"><div><strong>#${short(o.id)}</strong><p>${date(o.pickupDate)} · ${esc(o.pickupSlot)} · ${money(o.total)}</p></div>${badge(o.status)}</div>`,
        )
        .join("") || '<p class="muted">No upcoming reservations.</p>'
    }</div></div>` +
    `<div class="dashboard-grid" style="margin-top:18px"><div class="card"><div class="section-head"><h2>Fresh picks</h2><button class="btn secondary small" data-quick="products">Browse all</button></div><div class="quick-grid">${
      products
        .slice(0, 3)
        .map(
          (p) =>
            `<button class="quick-card" data-quick="products"><span>◉</span>${esc(p.name)}<br><small>${money(p.price)}</small></button>`,
        )
        .join("") || '<p class="muted">Products will appear here.</p>'
    }</div></div><div class="card"><div class="section-head"><h2>Community updates</h2></div>${
      announcements
        .slice(0, 4)
        .map(
          (a) =>
            `<div class="activity-line"><div><strong>${esc(a.title)}</strong><p>${esc(a.message)}</p></div></div>`,
        )
        .join("") || '<p class="muted">No current updates.</p>'
    }</div></div>`;
  content.querySelector("[data-hero-page]").onclick = () => show("products");
  content
    .querySelectorAll("[data-quick]")
    .forEach((b) => (b.onclick = () => show(b.dataset.quick)));
}
async function markets() {
  const [rows, allFarmers] = await Promise.all([
    api("/markets"),
    api("/farmers"),
  ]);
  content.innerHTML =
    heading(
      "DISCOVER LOCATIONS",
      "Markets",
      "Choose a market by city or operating day.",
    ) +
    `<div class="search"><input id="marketQuery" placeholder="Search city or market" aria-label="Search markets"><select id="marketDay"><option value="">All days</option>${["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((x) => `<option>${x}</option>`).join("")}</select></div><div class="grid three" id="marketList"></div>`;
  const render = () => {
    const q = $("#marketQuery").value.toLowerCase(),
      d = $("#marketDay").value;
    const filtered = rows.filter(
      (m) =>
        (m.name + " " + m.address + " " + (m.city || ""))
          .toLowerCase()
          .includes(q) &&
        (!d || m.days?.some((x) => x.includes(d))),
    );
    $("#marketList").innerHTML =
      filtered
        .map(
          (m) =>
            `<article class="card item">${imageTag(m.image, m.name, "market")}<div class="eyebrow">LOCAL MARKET</div><h3>${esc(m.name)}</h3><p>${esc(m.address)}</p><p><strong>${esc((m.days || []).join(", "))}</strong> · ${esc(m.hours || "Hours vary")}</p><p>${allFarmers.filter((f) => (f.markets || []).map(String).includes(String(m._id))).length} farmers</p>${mapEmbed(m.latitude, m.longitude)}<div class="item-foot"><button class="btn secondary small" data-market="${m._id}">View farmers</button><button class="btn secondary small" data-favmarket="${m._id}">${fav("markets", m._id) ? "♥ Saved" : "♡ Save"}</button></div></article>`,
        )
        .join("") || empty("No markets match this search.");
    $("#marketList").onclick = (e) => {
      const b = e.target.closest("[data-market]"),
        f = e.target.closest("[data-favmarket]");
      if (b) {
        sessionStorage.setItem("ml_market_filter", b.dataset.market);
        show("farmers");
      }
      if (f) favorite("markets", f.dataset.favmarket);
    };
  };
  $("#marketQuery").oninput = render;
  $("#marketDay").onchange = render;
  render();
}
async function farmers() {
  const [rows, markets, products] = await Promise.all([
    api("/farmers"),
    api("/markets"),
    api("/products"),
  ]);
  const marketFilter = sessionStorage.getItem("ml_market_filter") || "";
  content.innerHTML =
    heading(
      "MEET THE GROWERS",
      "Farmers",
      "Browse stalls and see where they sell each week.",
    ) +
    `<div class="search"><input id="farmerQuery" placeholder="Search stall, farmer or address" aria-label="Search farmers"><select id="farmerMarket"><option value="">All markets</option>${markets.map((m) => `<option value="${m._id}" ${marketFilter === m._id ? "selected" : ""}>${esc(m.name)}</option>`).join("")}</select></div><div class="grid three" id="farmerList"></div>`;
  sessionStorage.removeItem("ml_market_filter");
  const render = () => {
    const q = $("#farmerQuery").value.toLowerCase(),
      m = $("#farmerMarket").value;
    $("#farmerList").innerHTML =
      rows
        .filter(
          (f) =>
            (f.business + " " + f.name + " " + f.address)
              .toLowerCase()
              .includes(q) &&
            (!m || f.markets?.map(String).includes(m)),
        )
        .map(
          (f) =>
            `<article class="card item">${imageTag(f.image, f.business || f.name, "farmer")}<div class="eyebrow">LOCAL PRODUCER</div><h3>${esc(f.business || f.name)}</h3><p>${esc(f.name)} · ${esc(f.address)}</p><p>${esc((f.operatingDays || []).join(", ") || "Days to be confirmed")}</p><p>${products.filter((p) => String(p.farmer) === f.id).length} products listed</p><p><small>Markets: ${
              (f.markets || [])
                .map((id) => markets.find((m) => m._id === String(id))?.name)
                .filter(Boolean)
                .map(esc)
                .join(", ") || "To be confirmed"
            }</small></p>${f.latitude != null && f.longitude != null ? `<details><summary>Stall pin and directions</summary>${mapEmbed(f.latitude, f.longitude)}</details>` : ""}<div class="item-foot"><button class="btn secondary small" data-viewfarmer="${f.id}">View products</button><button class="btn secondary small" data-farmerreviews="${f.id}">Reviews</button><button class="btn secondary small" data-favfarmer="${f.id}">${fav("farmers", f.id) ? "♥ Saved" : "♡ Save"}</button></div></article>`,
        )
        .join("") || empty("No farmers match this search.");
    $("#farmerList").onclick = (e) => {
      const b = e.target.closest("[data-viewfarmer]"),
        f = e.target.closest("[data-favfarmer]"),
        r = e.target.closest("[data-farmerreviews]");
      if (b) {
        sessionStorage.setItem("ml_farmer_filter", b.dataset.viewfarmer);
        show("products");
      }
      if (f) favorite("farmers", f.dataset.favfarmer);
      if (r)
        api(`/reviews?farmer=${r.dataset.farmerreviews}`).then((reviews) =>
          modal(
            "Farmer reviews",
            `<div class="span-2">${reviews.map((x) => `<div class="item"><strong>${ratingLabel(x.rating)}</strong>${x.comment ? `<p>${esc(x.comment)}</p>` : ""}<small>${esc(x.customer?.name || "Customer")}</small>${x.response ? `<p><strong>Farmer reply:</strong> ${esc(x.response)}</p>` : ""}</div>`).join("") || '<p class="muted">No reviews yet.</p>'}</div>`,
            async () => {},
          ),
        );
    };
  };
  $("#farmerQuery").oninput = render;
  $("#farmerMarket").onchange = render;
  render();
}
async function products() {
  const [rows, allFarmers, markets, categories] = await Promise.all([
    api("/products"),
    api("/farmers"),
    api("/markets"),
    api("/categories"),
  ]);
  const names = new Map(allFarmers.map((f) => [f.id, f.business]));
  const farmerFilter = sessionStorage.getItem("ml_farmer_filter") || "";
  content.innerHTML =
    heading(
      "FRESH THIS WEEK",
      "Browse products",
      "Filter by category, price, market or farmer.",
    ) +
    `<div class="search"><input id="productQuery" placeholder="Search fresh products" aria-label="Search products"><select id="category"><option value="">All categories</option>${categories.map((c) => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join("")}</select><select id="market"><option value="">All markets</option>${markets.map((m) => `<option value="${m._id}">${esc(m.name)}</option>`).join("")}</select><select id="farmer"><option value="">All farmers</option>${allFarmers.map((f) => `<option value="${f.id}" ${farmerFilter === f.id ? "selected" : ""}>${esc(f.business)}</option>`).join("")}</select><input type="number" min="0" id="maxPrice" placeholder="Max Rs" aria-label="Maximum price" style="max-width:110px"></div><div class="grid three" id="productList"></div>`;
  sessionStorage.removeItem("ml_farmer_filter");
  const render = () => {
    const q = $("#productQuery").value.toLowerCase(),
      category = $("#category").value,
      m = $("#market").value,
      f = $("#farmer").value,
      max = Number($("#maxPrice").value || Infinity);
    $("#productList").innerHTML =
      rows
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) &&
            (!category || p.category === category) &&
            (!m || p.markets.map(String).includes(m)) &&
            (!f || String(p.farmer) === f) &&
            p.price <= max,
        )
        .map(
          (p) =>
            `<article class="card item">${imageTag(p.image, p.name, "product", p.category)}<div class="eyebrow">${esc(p.category)}</div><h3>${esc(p.name)}</h3><p>${esc(p.description || "Fresh local product")}</p><p>By ${esc(names.get(String(p.farmer)) || "Farmer")} · ${p.stock} ${esc(p.unit)} available${p.stock <= 5 ? ` · ${p.stock === 0 ? "Sold out" : "Low stock"}` : ""}</p><div class="item-foot"><strong>${money(p.price)} / ${esc(p.unit)}</strong><div class="inline-actions"><button class="btn secondary small" data-favproduct="${p._id}">${fav("products", p._id) ? "♥" : "♡"}</button><button class="btn small" data-add="${p._id}" ${p.stock === 0 ? "disabled" : ""}>Add +</button></div></div><button class="btn secondary small" data-reviews="${p._id}" style="margin-top:12px">Reviews</button></article>`,
        )
        .join("") || empty("No products match these filters.");
    $("#productList").onclick = async (e) => {
      const a = e.target.closest("[data-add]"),
        f = e.target.closest("[data-favproduct]"),
        r = e.target.closest("[data-reviews]");
      if (a) {
        cart[a.dataset.add] = (cart[a.dataset.add] || 0) + 1;
        saveCart();
        toast("Added to cart");
      }
      if (f) favorite("products", f.dataset.favproduct);
      if (r) {
        const reviews = await api(`/reviews?product=${r.dataset.reviews}`);
        modal(
          "Product reviews",
          `<div class="span-2">${reviews.map((x) => `<div class="item"><strong>${ratingLabel(x.rating)}</strong>${x.comment ? `<p>${esc(x.comment)}</p>` : ""}<small>${esc(x.customer?.name || "Customer")}</small></div>`).join("") || '<p class="muted">No reviews yet.</p>'}</div>`,
          async () => {},
        );
      }
    };
  };
  ["productQuery", "category", "market", "farmer", "maxPrice"].forEach((key) =>
    $("#" + key).addEventListener("input", render),
  );
  render();
}
async function cartPage() {
  const [products, markets, farmers] = await Promise.all([
    api("/products"),
    api("/markets"),
    api("/farmers"),
  ]);
  const items = Object.entries(cart)
    .map(([id, qty]) => ({ product: products.find((p) => p._id === id), qty }))
    .filter((x) => x.product);
  const eligible = markets.filter(
    (m) =>
      items.length &&
      items.every((x) => x.product.markets.map(String).includes(String(m._id))),
  );
  const owners = [...new Set(items.map((x) => String(x.product.farmer)))]
    .map((id) => farmers.find((f) => f.id === id))
    .filter(Boolean);
  const defaults = ["09:00–09:30", "09:30–10:00", "10:00–10:30"];
  const slots =
    owners.length === new Set(items.map((x) => String(x.product.farmer))).size
      ? owners.reduce(
          (common, farmer) =>
            common.filter((slot) =>
              (farmer.pickupSlots?.length
                ? farmer.pickupSlots
                : defaults
              ).includes(slot),
            ),
          owners[0]?.pickupSlots?.length ? owners[0].pickupSlots : defaults,
        )
      : [];
  const dates = (market) => {
    const result = [];
    if (
      !market?.days?.some((value) =>
        /Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/i.test(value),
      )
    )
      return result;
    for (let offset = 1; offset <= 28; offset++) {
      const day = new Date();
      day.setDate(day.getDate() + offset);
      const weekday = day.toLocaleDateString("en-US", { weekday: "long" });
      const open = (days) =>
        !days?.length ||
        days.some((value) =>
          value.toLowerCase().includes(weekday.toLowerCase()),
        );
      if (
        open(market.days) &&
        owners.every((farmer) => open(farmer.operatingDays))
      ) {
        const value = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
        result.push([
          value,
          `${weekday}, ${day.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}`,
        ]);
      }
    }
    return result;
  };
  const total = items.reduce((sum, x) => sum + x.product.price * x.qty, 0);
  content.innerHTML =
    heading(
      "COLLECT AT MARKET",
      "Cart & pickup",
      "Reserve fresh stock; pay the farmer in person at pickup.",
    ) +
    `<div class="grid split"><div>${
      items.length
        ? table(
            ["Product", "Price", "Quantity", "Subtotal", "Actions"],
            items.map(
              (x) =>
                `<tr><td><strong>${esc(x.product.name)}</strong></td><td>${money(x.product.price)}</td><td><input type="number" min="1" max="${x.product.stock}" value="${x.qty}" data-qty="${x.product._id}" style="width:70px"></td><td>${money(x.product.price * x.qty)}</td><td><button class="btn danger small" data-remove="${x.product._id}">Remove</button></td></tr>`,
            ),
          )
        : empty("Your cart is empty. Browse products to add items.")
    }</div>
    <div class="card"><div class="section-head"><h2>Your reservation</h2></div><p><strong>Total: ${money(total)}</strong></p><p class="page-note">No online payment or delivery. Collect and pay at market.</p>
    ${
      items.length
        ? `<form id="checkoutForm" class="grid">${select(
            "marketId",
            "Pickup market",
            eligible.map((m) => [m._id, m.name]),
          )}<div id="marketLocation" class="muted"></div><div id="dateField"></div>${select("pickupSlot", "Pickup time", slots)}${textarea("notes", "Notes for farmer")}<button class="btn" id="placeOrder">Place pre-order</button></form>`
        : ""
    }
    ${!eligible.length && items.length ? '<div class="alert">Items have no common pickup market. Order separately.</div>' : ""}
    ${!slots.length && items.length ? '<div class="alert">No shared pickup slot. Order separately.</div>' : ""}</div></div>`;
  content.onclick = (e) => {
    const button = e.target.closest("[data-remove]");
    if (button) {
      delete cart[button.dataset.remove];
      saveCart();
      show("cart");
    }
  };
  content.onchange = (e) => {
    const quantity = e.target.closest("[data-qty]");
    if (quantity) {
      cart[quantity.dataset.qty] = Math.max(1, Number(quantity.value));
      saveCart();
      show("cart");
    }
  };
  const form = $("#checkoutForm");
  if (!form) return;
  const updateDates = () => {
    const market = eligible.find((m) => m._id === form.elements.marketId.value);
    const options = dates(market);
    $("#dateField").innerHTML = select("pickupDate", "Pickup date", options);
    $("#marketLocation").textContent = market
      ? `${market.address} · ${(market.days || []).join(", ") || "Pickup schedule to be confirmed by admin"}`
      : "";
    $("#placeOrder").disabled = !market || !options.length || !slots.length;
  };
  form.elements.marketId.addEventListener("change", updateDates);
  updateDates();
  form.onsubmit = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    try {
      await api("/orders", {
        method: "POST",
        body: {
          ...data,
          items: items.map((x) => ({ productId: x.product._id, qty: x.qty })),
        },
      });
      cart = {};
      saveCart();
      toast("Pre-order placed");
      show("orders");
    } catch (err) {
      toast(err.message, true);
    }
  };
}
async function orders() {
  const [rows, farmers, markets] = await Promise.all([
    api("/orders"),
    api("/farmers"),
    api("/markets"),
  ]);
  const farmerById = new Map(
    farmers.map((f) => [f.legacyId || f.id, f.business]),
  );
  const marketById = new Map(markets.map((m) => [m.legacyId || m._id, m.name]));
  content.innerHTML =
    heading(
      "PICKUP HISTORY",
      "My orders",
      "Track, modify and cancel before the farmer’s cutoff.",
    ) +
    `<div class="grid two">${rows.length ? rows.map((o) => `<article class="card"><div class="section-head"><h2>#${short(o.id)}</h2>${badge(o.status)}</div><strong>${esc(farmerById.get(o.farmerId) || o.farmerId)}</strong>${o.items.map((i) => `<div class="order-product">${imageTag(i.image, i.name)}<div><strong>${i.qty} ${esc(i.unit)} × ${esc(i.name)}</strong><p>${money(i.price)} / ${esc(i.unit)}</p></div></div>`).join("")}<div class="order-steps">${["placed", "accepted", "packing", "packed", "ready", "completed"].map((step, index, steps) => `<span class="${steps.indexOf(o.status === "out_for_delivery" ? "packed" : o.status) >= index ? "done" : ""}">${step === "ready" ? "ready for pickup" : esc(step)}</span>`).join("")}</div><p class="muted">${esc(marketById.get(o.marketId) || o.marketId)}<br>${date(o.pickupDate)} • ${esc(o.pickupSlot)}</p><strong>${money(o.total)}</strong><div class="inline-actions" style="margin-top:14px">${["placed", "accepted"].includes(o.status) ? `<button class="btn danger small" data-cancel="${o.id}">Cancel</button>` : ""}${o.status === "placed" ? `<button class="btn secondary small" data-modify="${o.id}">Change pickup</button>` : ""}${o.status === "completed" ? `<button class="btn secondary small" data-reorder="${o.id}">Reorder</button><button class="btn secondary small" data-review="${o.id}">Leave review</button>` : ""}</div></article>`).join("") : empty("No orders yet.")}</div>`;
  content.onclick = async (e) => {
    const cancel = e.target.closest("[data-cancel]"),
      modify = e.target.closest("[data-modify]"),
      reorder = e.target.closest("[data-reorder]"),
      review = e.target.closest("[data-review]");
    if (cancel && confirmAction("Cancel this reservation?"))
      try {
        await api(`/orders/${cancel.dataset.cancel}/status`, {
          method: "PATCH",
          body: { status: "cancelled" },
        });
        toast("Reservation cancelled");
        show("orders");
      } catch (err) {
        toast(err.message, true);
      }
    if (modify) {
      const o = rows.find((x) => x.id === modify.dataset.modify);
      modal(
        "Change order",
        field("pickupDate", "New date", o.pickupDate, "date", true) +
          field("pickupSlot", "New slot", o.pickupSlot, "text", true) +
          o.items
            .map((i) =>
              field(
                "qty-" + i.productId,
                `${i.name} quantity`,
                i.qty,
                "number",
                true,
              ),
            )
            .join("") +
          textarea("notes", "Notes", o.notes),
        async (d) => {
          const items = o.items.map((i) => ({
            productId: i.productId,
            qty: Number(d["qty-" + i.productId]),
          }));
          await api(`/orders/${o.id}`, {
            method: "PATCH",
            body: {
              pickupDate: d.pickupDate,
              pickupSlot: d.pickupSlot,
              notes: d.notes,
              items,
            },
          });
          toast("Order updated");
          show("orders");
        },
      );
    }
    if (reorder) {
      const o = rows.find((x) => x.id === reorder.dataset.reorder),
        products = await api("/products");
      for (const i of o.items) {
        const p = products.find(
          (x) => x.legacyId === i.productId || x._id === i.productId,
        );
        if (p) cart[p._id] = (cart[p._id] || 0) + i.qty;
      }
      saveCart();
      toast("Available items added to cart");
      show("cart");
    }
    if (review) {
      const o = rows.find((x) => x.id === review.dataset.review),
        products = await api("/products");
      modal(
        "Rate your completed order",
        select("rating", "Stars and emoji", reviewRatings.map(({ value, label }) => [value, label]), 5) +
          select("productId", "Review target", [
            ["", "Farmer service"],
            ["market", "Market service"],
            ...o.items.map((i) => {
              const p = products.find(
                (x) => x.legacyId === i.productId || x._id === i.productId,
              );
              return [p?._id || "", i.name];
            }),
          ]) +
          textarea("comment", "Your comment (optional)"),
        async (d) => {
          await api("/reviews", {
            method: "POST",
            body: {
              orderId: o.id,
              rating: Number(d.rating),
              comment: d.comment,
              ...(d.productId === "market"
                ? {
                    marketId: markets.find(
                      (m) => m.legacyId === o.marketId || m._id === o.marketId,
                    )?._id,
                  }
                : { productId: d.productId || undefined }),
            },
          });
          toast("Review submitted");
        },
        "Submit review",
      );
    }
  };
}
async function favorites() {
  const [fav, products, farmers, markets] = await Promise.all([
    api("/favorites"),
    api("/products"),
    api("/farmers"),
    api("/markets"),
  ]);
  user.favorites = fav;
  content.innerHTML =
    heading(
      "SAVED FOR LATER",
      "Favorites",
      "Quick access to your preferred items, farmers and markets.",
    ) +
    `<div class="grid three"><div class="card"><h2>Products</h2>${
      products
        .filter((x) => fav.products?.map(String).includes(x._id))
        .map(
          (x) =>
            `<div class="item"><strong>${esc(x.name)}</strong><p>${money(x.price)}</p><button class="btn secondary small" data-favproduct="${x._id}">Remove ♡</button></div>`,
        )
        .join("") || '<p class="muted">No saved products.</p>'
    }</div><div class="card"><h2>Farmers</h2>${
      farmers
        .filter((x) => fav.farmers?.map(String).includes(x.id))
        .map(
          (x) =>
            `<div class="item"><strong>${esc(x.business)}</strong><p>${esc(x.address)}</p><button class="btn secondary small" data-favfarmer="${x.id}">Remove ♡</button></div>`,
        )
        .join("") || '<p class="muted">No saved farmers.</p>'
    }</div><div class="card"><h2>Markets</h2>${
      markets
        .filter((x) => fav.markets?.map(String).includes(x._id))
        .map(
          (x) =>
            `<div class="item"><strong>${esc(x.name)}</strong><p>${esc(x.address)}</p><button class="btn secondary small" data-favmarket="${x._id}">Remove ♡</button></div>`,
        )
        .join("") || '<p class="muted">No saved markets.</p>'
    }</div></div>`;
  content.onclick = (e) => {
    const b = e.target.closest(
      "[data-favproduct],[data-favfarmer],[data-favmarket]",
    );
    if (b)
      favorite(
        b.dataset.favproduct
          ? "products"
          : b.dataset.favfarmer
            ? "farmers"
            : "markets",
        b.dataset.favproduct || b.dataset.favfarmer || b.dataset.favmarket,
      );
  };
}
async function profile() {
  content.innerHTML =
    heading(
      "YOUR ACCOUNT",
      "My profile",
      "Keep your contact and pickup information current.",
    ) +
    `<form id="profileForm" class="card form-grid">${field("name", "Full name", user.name, "text", true)}${field("phone", "Phone number", user.phone, "tel", true)}${field("email", "Email (cannot change here)", user.email, "email")}${field("address", "Address", user.address, "text", true)}<div class="span-2"><button class="btn">Save changes</button></div></form>`;
  $("#profileForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    delete d.email;
    try {
      user = await api("/profile", { method: "PATCH", body: d });
      toast("Profile saved");
      show("profile");
    } catch (err) {
      toast(err.message, true);
    }
  };
}
if (user) {
  shell(user, nav, show);
  await show(location.hash.slice(1) || "overview");
}
