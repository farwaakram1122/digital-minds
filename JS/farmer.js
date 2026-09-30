// Farmer pages: manage stall details, products, stock and pickup orders.
import {
  $,
  api,
  uploadProductImage,
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
  imageTag,
} from "./core.js";
import { messagesPage } from "./messages.js";
import { unitsFor } from "./productUnits.js";
const nav = [
  ["overview", "Overview", "◫"],
  ["products", "Products", "▣"],
  ["stock", "Weekly stock", "▤"],
  ["orders", "Pre-orders", "◈"],
  ["notifications", "Notifications", "◉"],
  ["messages", "Messages", "✉"],
  ["slots", "Pickup slots", "◷"],
  ["profile", "Business profile", "♙"],
  ["reviews", "Reviews", "★"],
  ["insights", "Insights", "▥"],
];
let user = await guard("farmer"),
  page = "overview";
const content = $("#content");
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
  products,
  stock,
  orders,
  notifications: () => notificationsPage(content, () => show("notifications")),
  messages: () => messagesPage(user, content, () => show("messages")),
  slots,
  profile,
  reviews,
  insights,
};
async function overview() {
  const [r, products, orders, notes] = await Promise.all([
    api("/farmer/insights"),
    api("/farmer/products"),
    api("/orders"),
    api("/announcements"),
  ]);
  const top = products.slice(0, 6);
  const ready = orders.filter((o) => o.status === "ready").length;
  content.innerHTML =
    heading(
      "FARMER WORKSPACE",
      "Farmer dashboard",
      "Your stall, stock and pickup orders at a glance.",
    ) +
    hero(
      "YOUR STALL",
      `Hello, ${user.name}.`,
      `${user.business || "Your farm"} is ready to share this week’s produce. Update inventory before your next market day.`,
      "Add a product",
      "products",
    ) +
    `<div class="grid stats">${stat("Total orders", r.totalOrders, "All time")}${stat("New / pending", r.pendingOrders, "Needs attention")}${stat("Ready for pickup", ready, "Awaiting collection")}${stat("Completed revenue", money(r.revenue), "Paid at pickup")}${stat("Active products", products.filter((p) => p.available).length, "Live listings")}${stat("Low stock", products.filter((p) => p.stock <= 5).length, "5 or fewer units")}</div>` +
    `<div class="dashboard-grid"><div class="card"><div class="section-head"><h2>Stock snapshot</h2><small>Available units</small></div>${barChart(
      top.map((p) => p.stock),
      top.map((p) => (p.name.length > 10 ? p.name.slice(0, 9) + "…" : p.name)),
    )}</div><div class="card"><div class="section-head"><h2>Order progress</h2><small>Completed pickups</small></div>${donut(orders.filter((o) => o.status === "completed").length, orders.length, "Completed")}</div></div>` +
    `<div class="dashboard-grid" style="margin-top:18px"><div class="card"><div class="section-head"><h2>Quick actions</h2></div><div class="quick-grid"><button class="quick-card" data-quick="products"><span>▣</span>Add products</button><button class="quick-card" data-quick="stock"><span>▤</span>Update stock</button><button class="quick-card" data-quick="slots"><span>◷</span>Pickup slots</button></div><div class="section-head" style="margin-top:23px"><h2>Incoming reservations</h2></div>${
      orders
        .filter((o) => o.status === "placed")
        .slice(0, 3)
        .map(
          (o) =>
            `<div class="activity-line"><div><strong>#${short(o.id)} · ${esc(o.customer)}</strong><p>${date(o.pickupDate)} · ${esc(o.pickupSlot)}</p></div>${badge(o.status)}</div>`,
        )
        .join("") || '<p class="muted">No new orders.</p>'
    }</div><div class="card"><div class="section-head"><h2>Market location</h2><small>${notes.length} updates</small></div><p class="muted">${esc(user.business || "Your stall")} · ${esc(user.address || "Set your address")}</p>${
      notes
        .slice(0, 3)
        .map(
          (a) =>
            `<div class="activity-line"><div><strong>${esc(a.title)}</strong><p>${esc(a.message)}</p></div></div>`,
        )
        .join("") || '<p class="muted">No market announcements yet.</p>'
    }</div></div>`;
  content.querySelector("[data-hero-page]").onclick = () => show("products");
  content
    .querySelectorAll("[data-quick]")
    .forEach((b) => (b.onclick = () => show(b.dataset.quick)));
}
async function products() {
  const [rows, categories, markets] = await Promise.all([
    api("/farmer/products"),
    api("/categories"),
    api("/markets"),
  ]);
  content.innerHTML =
    heading(
      "CATALOGUE",
      "Products",
      "Create listings, change prices and manage availability.",
      `<button class="btn" id="addProduct">+ Add product</button>`,
    ) +
    table(
      ["Product", "Category", "Price / unit", "Stock", "Status", "Actions"],
      rows.map(
        (p) =>
          `<tr><td><div class="order-product">${imageTag(p.image, p.name, "product", p.category)}<div><strong>${esc(p.name)}</strong><br><small>${esc(p.description?.slice(0, 70))}</small></div></div></td><td>${esc(p.category)}</td><td>${money(p.price)} / ${esc(p.unit)}</td><td>${p.stock} ${esc(p.unit)}${p.reserved ? ` <small>(${p.reserved} reserved)</small>` : ""}</td><td>${badge(!p.available ? "paused" : p.stock <= 5 ? "low stock" : "available")}</td><td><div class="inline-actions"><button class="btn secondary small" data-edit="${p._id}">Edit</button><button class="btn secondary small" data-toggle="${p._id}">${p.available ? "Pause" : "Resume"}</button><button class="btn danger small" data-delete="${p._id}">Delete</button></div></td></tr>`,
      ),
    );
  $("#addProduct").onclick = () => productForm(null, categories, markets);
  content.onclick = async (e) => {
    const edit = e.target.closest("[data-edit]"),
      toggle = e.target.closest("[data-toggle]"),
      del = e.target.closest("[data-delete]");
    if (edit)
      productForm(
        rows.find((p) => p._id === edit.dataset.edit),
        categories,
        markets,
      );
    if (toggle) {
      const p = rows.find((p) => p._id === toggle.dataset.toggle);
      try {
        await api(`/farmer/products/${p._id}`, {
          method: "PATCH",
          body: { available: !p.available },
        });
        toast("Availability updated");
        show("products");
      } catch (err) {
        toast(err.message, true);
      }
    }
    if (del && confirmAction("Delete this product?"))
      try {
        await api(`/farmer/products/${del.dataset.delete}`, {
          method: "DELETE",
        });
        toast("Product deleted");
        show("products");
      } catch (err) {
        toast(err.message, true);
      }
  };
}
function productForm(p, categories, markets) {
  const options = markets
    .filter((m) => (user.markets || []).map(String).includes(String(m._id)))
    .map((m) => [m._id, m.name]);
  const primary = String(p?.markets?.[0] || options[0]?.[0] || "");
  modal(
    p ? "Edit product" : "Add product",
    field("name", "Product name", p?.name, "text", true) +
      select(
        "category",
        "Category",
        categories.map((c) => c.name),
        p?.category,
      ) +
      field("price", "Price (Rs)", p?.price ?? "", "number", true) +
      select(
        "unit",
        "Price per unit",
        unitsFor(p?.category || categories[0]?.name, p?.name),
        p?.unit,
      ) +
      field(
        "stock",
        "Current stock (same unit)",
        p?.stock ?? 0,
        "number",
        true,
      ) +
      select(
        "market",
        "Market",
        options.length ? options : [["", "Choose a market in profile"]],
        primary,
      ) +
      field("image", "Image URL (optional)", p?.image) +
      `<label class="field">Or upload product image (JPG, PNG, WebP · max 3 MB)<input name="imageFile" type="file" accept="image/jpeg,image/png,image/webp"></label>` +
      textarea("description", "Description", p?.description),
    async (data) => {
      if (!data.market)
        throw Error("First select a market in Business profile");
      const image = data.imageFile?.size
        ? await uploadProductImage(data.imageFile)
        : data.image;
      const body = {
        name: data.name,
        category: data.category,
        price: Number(data.price),
        unit: data.unit,
        stock: Number(data.stock),
        markets: [data.market],
        description: data.description,
        image,
        available: p?.available ?? true,
      };
      await api("/farmer/products" + (p ? "/" + p._id : ""), {
        method: p ? "PATCH" : "POST",
        body,
      });
      toast("Product saved");
      show("products");
    },
  );
  const form = $("#modalForm");
  const updateUnits = () => {
    const unit = form.elements.unit.value;
    const options = unitsFor(
      form.elements.category.value,
      form.elements.name.value,
    );
    form.elements.unit.innerHTML = options
      .map((value) => `<option value="${esc(value)}">${esc(value)}</option>`)
      .join("");
    form.elements.unit.value = options.includes(unit) ? unit : options[0];
  };
  form.elements.category.addEventListener("change", updateUnits);
  form.elements.name.addEventListener("input", updateUnits);
}
async function stock() {
  const rows = await api("/farmer/products");
  content.innerHTML =
    heading(
      "INVENTORY",
      "Weekly stock",
      "Save a recurring weekly quantity and adjust current stock.",
    ) +
    `<form id="stockForm">${table(
      ["Product", "Weekly template", "Current stock", "Availability"],
      rows.map(
        (p) =>
          `<tr><td><strong>${esc(p.name)}</strong></td><td><input type="number" min="0" name="template-${p._id}" value="${p.weeklyTemplate || 0}" aria-label="Weekly quantity for ${esc(p.name)}"> ${esc(p.unit)}</td><td><input type="number" min="0" name="stock-${p._id}" value="${p.stock}" aria-label="Current stock for ${esc(p.name)}"> ${esc(p.unit)}</td><td>${badge(p.available ? "available" : "paused")}</td></tr>`,
      ),
    )}<p class="inline-actions"><button class="btn">Save weekly stock</button><button class="btn secondary" type="button" id="applyTemplate">Apply saved template this week</button></p></form>`;
  // A template is reusable each week; open orders keep their reserved stock.
  $("#applyTemplate").onclick = () => {
    const form = $("#stockForm");
    for (const p of rows) {
      const amount = Number(form.elements["template-" + p._id].value);
      if (amount < (p.reserved || 0)) {
        toast(`${p.name} has ${p.reserved} reserved; increase its weekly template first.`, true);
        return;
      }
    }
    for (const p of rows)
      form.elements["stock-" + p._id].value = form.elements["template-" + p._id].value;
    form.requestSubmit();
  };
  $("#stockForm").onsubmit = async (e) => {
    e.preventDefault();
    try {
      const d = new FormData(e.currentTarget);
      for (const p of rows)
        await api(`/farmer/products/${p._id}`, {
          method: "PATCH",
          body: {
            weeklyTemplate: Number(d.get("template-" + p._id)),
            stock: Number(d.get("stock-" + p._id)),
          },
        });
      toast("Weekly stock saved");
      show("stock");
    } catch (err) {
      toast(err.message, true);
    }
  };
}
const nextStatus = {
  placed: ["accepted", "Accept order"],
  accepted: ["packing", "Start packing"],
  packing: ["packed", "Mark packed"],
  packed: ["ready", "Ready for pickup"],
  out_for_delivery: ["ready", "Ready for pickup"],
  ready: ["completed", "Complete pickup"],
};
async function orders() {
  const rows = await api("/orders");
  content.innerHTML =
    heading(
      "RESERVATIONS",
      "Pre-orders",
      "Update each stage; the customer gets an alert and email.",
    ) +
    `<div class="grid two">${
      rows
        .map(
          (o) => `<article class="card item">
      <div class="section-head"><h2>#${short(o.id)}</h2>${badge(o.status.replaceAll("_", " "))}</div>
      <strong>${esc(o.customer)}</strong>
      ${o.items
        .map(
          (
            i,
          ) => `<div class="order-product">${imageTag(i.image, i.name)}
        <div><strong>${i.qty} ${esc(i.unit)} × ${esc(i.name)}</strong><p>${money(i.price)} / ${esc(i.unit)}</p></div></div>`,
        )
        .join("")}
      <p>${date(o.pickupDate)} · ${esc(o.pickupSlot)} · <strong>${money(o.total)}</strong></p>
      <p class="page-note">Notes: ${esc(o.notes || "None")}</p>
      <div class="order-steps">${[
        "placed",
        "accepted",
        "packing",
        "packed",
        "ready",
        "completed",
      ]
        .map(
          (step, index, steps) =>
            `<span class="${steps.indexOf(o.status === "out_for_delivery" ? "packed" : o.status) >= index ? "done" : ""}">${step === "ready" ? "ready for pickup" : esc(step)}</span>`,
        )
        .join("")}</div>
      <div class="inline-actions">${nextStatus[o.status] ? `<button class="btn small" data-order="${o.id}" data-next="${nextStatus[o.status][0]}">${nextStatus[o.status][1]}</button>` : ""}
        ${o.status === "placed" ? `<button class="btn danger small" data-order="${o.id}" data-next="declined">Decline</button>` : ""}</div>
    </article>`,
        )
        .join("") || empty("No reservations yet.")
    }</div>`;
  content.onclick = async (event) => {
    const button = event.target.closest("[data-order]");
    if (!button) return;
    try {
      await api(`/orders/${button.dataset.order}/status`, {
        method: "PATCH",
        body: { status: button.dataset.next },
      });
      toast("Customer notified");
      show("orders");
    } catch (error) {
      toast(error.message, true);
    }
  };
}
async function slots() {
  content.innerHTML =
    heading(
      "COLLECTION WINDOWS",
      "Pickup slots",
      "Set times customers may select and the order cutoff.",
    ) +
    `<form id="slotsForm" class="card form-grid">${field("pickupSlots", "Slots (comma separated)", (user.pickupSlots || []).join(", ") || "09:00–09:30, 09:30–10:00")}${field("cutoffHours", "Cutoff hours before pickup", user.cutoffHours ?? 2, "number", true)}<div class="span-2"><button class="btn">Save pickup settings</button></div></form><p class="page-note">Example: 09:00–09:30, 09:30–10:00. Market day and capacity are checked at checkout.</p>`;
  $("#slotsForm").onsubmit = async (e) => {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    try {
      user = await api("/profile", {
        method: "PATCH",
        body: {
          pickupSlots: String(d.get("pickupSlots"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          cutoffHours: Number(d.get("cutoffHours")),
        },
      });
      toast("Pickup windows saved");
      show("slots");
    } catch (err) {
      toast(err.message, true);
    }
  };
}
async function profile() {
  const markets = await api("/markets");
  content.innerHTML =
    heading(
      "STALL DETAILS",
      "Business profile",
      "Where shoppers can find you on market day.",
    ) +
    `<form id="profileForm" class="card form-grid">${field("business", "Stall / business name", user.business, "text", true)}${field("name", "Contact person", user.name, "text", true)}${field("phone", "Contact number", user.phone, "tel", true)}${field("address", "Stall address", user.address, "text", true)}${field("operatingDays", "Operating days (comma separated)", (user.operatingDays || []).join(", "))}<label class="field span-2">Markets (select one or more)<input id="marketSearch" type="search" placeholder="Search market or city"><select name="markets" multiple size="${Math.min(markets.length, 5) || 2}">${markets.map((m) => `<option value="${m._id}" ${(user.markets || []).map(String).includes(String(m._id)) ? "selected" : ""}>${esc(m.name)} · ${esc(m.city || m.address)}</option>`).join("")}</select></label>${field("imageUrl", "Stall image URL (HTTPS, optional)", user.image?.startsWith("https://") ? user.image : "", "url")}<label class="field">Or upload stall photo (JPG, PNG, WebP · max 3 MB)<input name="stallImage" type="file" accept="image/jpeg,image/png,image/webp"></label>${field("stallMapUrl", "Exact stall pin (OpenStreetMap marker link)", "", "url")}<p class="page-note span-2">Mark the pickup point on OpenStreetMap and paste a link containing mlat and mlon. Leave empty to keep your current pin.</p>${user.latitude != null && user.longitude != null ? mapEmbed(user.latitude, user.longitude) : ""}${imageTag(user.image, user.business || user.name, "farmer", "", 'class="span-2" width="140" height="95"')}<div class="span-2"><button class="btn">Save business profile</button></div></form>`;
  const marketSearch = $("#marketSearch");
  marketSearch.oninput = () => {
    for (const option of marketSearch.nextElementSibling.options)
      option.hidden = !option.textContent
        .toLowerCase()
        .includes(marketSearch.value.toLowerCase());
  };
  $("#profileForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      d = new FormData(f);
    try {
      const photo = d.get("stallImage");
      // A new upload wins if both options are filled; otherwise keep the current photo.
      const imageUrl = String(d.get("imageUrl") || "").trim();
      const image = photo?.size ? await uploadProductImage(photo) : imageUrl || user.image;
      user = await api("/profile", {
        method: "PATCH",
        body: {
          business: d.get("business"),
          name: d.get("name"),
          phone: d.get("phone"),
          address: d.get("address"),
          operatingDays: String(d.get("operatingDays"))
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
          image,
          ...(d.get("stallMapUrl") ? { stallMapUrl: String(d.get("stallMapUrl")).trim() } : {}),
          markets: [...f.elements.markets.selectedOptions].map((o) => o.value),
        },
      });
      toast("Profile saved");
      show("profile");
    } catch (err) {
      toast(err.message, true);
    }
  };
}
async function reviews() {
  const rows = await api(`/reviews?farmer=${user.id}`);
  content.innerHTML =
    heading(
      "CUSTOMER FEEDBACK",
      "Reviews",
      "See customer ratings and respond when useful.",
    ) +
    `<div class="grid two">${rows.length ? rows.map((r) => `<article class="card"><div class="section-head"><h2>${ratingLabel(r.rating)}</h2><small>${date(r.createdAt)}</small></div><small>${esc(r.market?.name || r.product?.name || "Farmer service")}</small>${r.comment ? `<p>${esc(r.comment)}</p>` : ""}<p class="muted">${esc(r.customer?.name || "Customer")}</p>${r.response ? `<div class="notice"><strong>Your reply:</strong> ${esc(r.response)}</div>` : `<button class="btn secondary small" data-reply="${r._id}">Respond</button>`}</article>`).join("") : empty("No reviews yet.")}</div>`;
  content.onclick = (e) => {
    const b = e.target.closest("[data-reply]");
    if (b)
      modal(
        "Respond to review",
        textarea("response", "Your reply"),
        async (d) => {
          await api(`/farmer/reviews/${b.dataset.reply}/respond`, {
            method: "PATCH",
            body: d,
          });
          toast("Reply posted");
          show("reviews");
        },
      );
  };
}
async function insights() {
  const r = await api("/farmer/insights");
  content.innerHTML =
    heading(
      "PERFORMANCE",
      "Insights",
      "Completed sales, incoming reservations and best-selling items.",
    ) +
    `<div class="grid stats">${stat("Total orders", r.totalOrders)}${stat("Pending orders", r.pendingOrders)}${stat("Completed revenue", money(r.revenue))}</div>` +
    table(
      ["Product", "Units sold", "Completed value"],
      r.bestSelling.map(
        (p) =>
          `<tr><td>${esc(p.name)}</td><td>${p.quantity}</td><td>${money(p.value)}</td></tr>`,
      ),
    );
}
if (user) {
  shell(user, nav, show);
  await show(location.hash.slice(1) || "overview");
}
