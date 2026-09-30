// Admin pages: approvals, markets, reports and announcements use the API.
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
  hero,
  barChart,
  donut,
  mapEmbed,
  notificationsPage,
  imageTag,
  ratingLabel,
} from "./core.js";
import { downloadReport } from "./reportExport.js";
const nav = [
  ["overview", "Overview", "◫"],
  ["farmers", "Farmers", "♧"],
  ["customers", "Customers", "♙"],
  ["markets", "Markets", "⌖"],
  ["products", "Products", "▣"],
  ["categories", "Categories", "▤"],
  ["orders", "Orders", "◈"],
  ["reviews", "Reviews", "★"],
  ["announcements", "Announcements", "◉"],
  ["notifications", "Notifications", "◉"],
  ["inbox", "Inbox", "✉"],
  ["reports", "Reports", "▥"],
];
const user = await guard("admin");
const content = $("#content");
let page = "overview";
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
  farmers: () => users("farmer"),
  customers: () => users("customer"),
  markets,
  products,
  categories,
  orders,
  reviews,
  announcements,
  notifications: () => notificationsPage(content, () => show("notifications")),
  inbox,
  reports,
};
async function overview() {
  const [r, people, orders, notes] = await Promise.all([
    api("/admin/reports"),
    api("/admin/users"),
    api("/orders"),
    api("/admin/announcements"),
  ]);
  const pending = people.filter((p) => p.status === "pending");
  const completed = orders.filter((o) => o.status === "completed").length;
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
      "PLATFORM OVERVIEW",
      "Admin dashboard",
      "Manage the people and markets behind every local pickup.",
    ) +
    hero(
      "MARKETLINK CONTROL",
      "Keep your market moving.",
      `${pending.length} farmer registration${pending.length === 1 ? "" : "s"} waiting for review. Keep listings fresh and market locations up to date.`,
      "Review farmers",
      "farmers",
    ) +
    `<div class="grid stats">${stat("Farmers", r.farmers, "Producers")}${stat("Customers", r.customers, "Shoppers")}${stat("Markets", r.markets, "Locations")}${stat("Orders", r.orders, "All reservations")}${stat("Pending approval", pending.length, "Needs review")}${stat("Completed revenue", money(r.revenue), "At pickup")}</div>` +
    `<div class="dashboard-grid"><div class="card"><div class="section-head"><h2>Order activity</h2><small>Last 6 months</small></div>${barChart(counts, labels)}</div><div class="card"><div class="section-head"><h2>Pickup progress</h2><small>Completed orders</small></div>${donut(completed, orders.length, "Completed")}</div></div>` +
    `<div class="dashboard-grid" style="margin-top:18px"><div class="card"><div class="section-head"><h2>Quick actions</h2></div><div class="quick-grid"><button class="quick-card" data-quick="farmers"><span>♧</span>Approve farmer</button><button class="quick-card" data-quick="markets"><span>⌖</span>Manage markets</button><button class="quick-card" data-quick="announcements"><span>◉</span>Post update</button></div><div class="section-head" style="margin-top:23px"><h2>Pending registrations</h2></div>${
      pending.length
        ? pending
            .slice(0, 4)
            .map(
              (p) =>
                `<div class="activity-line"><div><strong>${esc(p.business || p.name)}</strong><p>${esc(p.email)}</p></div>${badge(p.status)}</div>`,
            )
            .join("")
        : '<p class="muted">No pending registrations.</p>'
    }</div><div class="card"><div class="section-head"><h2>Recent reservations</h2><small>${notes.length} updates posted</small></div>${
      orders
        .slice(0, 5)
        .map(
          (o) =>
            `<div class="activity-line"><div><strong>#${short(o.id)} · ${esc(o.customer)}</strong><p>${money(o.total)} · ${date(o.pickupDate)}</p></div>${badge(o.status)}</div>`,
        )
        .join("") || '<p class="muted">No orders yet.</p>'
    }</div></div>`;
  content.querySelector("[data-hero-page]").onclick = () => show("farmers");
  content
    .querySelectorAll("[data-quick]")
    .forEach((b) => (b.onclick = () => show(b.dataset.quick)));
}
async function users(type) {
  const rows = await api(`/admin/users?role=${type}`);
  content.innerHTML =
    heading(
      "USER MANAGEMENT",
      type === "farmer" ? "Farmers" : "Customers",
      type === "farmer"
        ? "Approve new registrations and suspend accounts."
        : "Activate or suspend customer access.",
    ) +
    '<div class="search"><input id="adminQuery" placeholder="Search name, email or location" aria-label="Search users"></div>' +
    table(
      ["Name", "Email", "Contact", "Location", "Status", "Actions"],
      rows.map(
        (p) =>
          `<tr><td><strong>${esc(p.business || p.name)}</strong><br><small>${esc(p.name)}</small></td><td>${esc(p.email)}</td><td>${esc(p.phone)}</td><td>${esc(p.address)}</td><td>${badge(p.status)}</td><td><div class="inline-actions">${p.status !== "active" ? `<button class="btn small" data-status="active" data-id="${p.id}">${p.status === "pending" ? "Approve" : "Activate"}</button>` : ""}${p.status !== "suspended" ? `<button class="btn danger small" data-status="suspended" data-id="${p.id}">Suspend</button>` : ""}${type === "farmer" ? `<button class="btn secondary small" data-reset="${p.id}" data-email="${esc(p.email)}">Reset password</button>` : ""}</div></td></tr>`,
      ),
    );
  $("#adminQuery").oninput = (e) => {
    const q = e.target.value.toLowerCase();
    content
      .querySelectorAll(".table tbody tr")
      .forEach((tr) => (tr.hidden = !tr.textContent.toLowerCase().includes(q)));
  };
  content.onclick = async (e) => {
    const reset = e.target.closest("[data-reset]");
    if (reset) {
      if (!confirmAction(`Reset password for ${reset.dataset.email}? The old password will stop working.`)) return;
      try {
        const result = await api(`/admin/users/${reset.dataset.reset}/reset-password`, { method: "POST" });
        window.prompt(`New password for ${result.email} (copy now; shown only once):`, result.password);
      } catch (err) { toast(err.message, true); }
      return;
    }
    const btn = e.target.closest("[data-status]");
    if (!btn) return;
    try {
      await api(`/admin/users/${btn.dataset.id}/status`, {
        method: "PATCH",
        body: { status: btn.dataset.status },
      });
      toast("Account updated");
      show(page);
    } catch (err) {
      toast(err.message, true);
    }
  };
}
const configs = {
  markets: {
    url: "/admin/markets",
    title: "Markets",
    subtitle: "Locations, market days, timings and map pins.",
    columns: [
      "Market",
      "Address",
      "Operating days",
      "Timing",
      "Status",
      "Actions",
    ],
    fields: [
      ["name", "Market name", "text", true],
      ["address", "Address", "text", true],
      ["city", "City", "text"],
      ["image", "Card image URL", "text"],
      ["days", "Days (comma separated)", "list"],
      ["hours", "Opening hours", "text"],
      ["latitude", "Latitude", "number"],
      ["longitude", "Longitude", "number"],
    ],
    cells: (r) => [
      r.name,
      r.address,
      (r.days || []).join(", "),
      r.hours,
      r.active === false ? "Inactive" : "Active",
    ],
  },
  categories: {
    url: "/admin/categories",
    title: "Categories",
    subtitle: "Product category master list.",
    columns: ["Category", "Actions"],
    fields: [["name", "Category name", "text", true]],
    cells: (r) => [r.name],
  },
  announcements: {
    url: "/admin/announcements",
    title: "Announcements",
    subtitle: "Publish platform-wide news and market updates.",
    columns: ["Title", "Message", "Published", "Actions"],
    fields: [
      ["title", "Title", "text", true],
      ["message", "Message", "textarea", true],
    ],
    cells: (r) => [
      r.title,
      r.message,
      r.active === false ? "Hidden" : "Published",
    ],
  },
};
async function resource(key) {
  const cfg = configs[key],
    rows = await api(cfg.url);
  content.innerHTML =
    heading(
      "PLATFORM SETTINGS",
      cfg.title,
      cfg.subtitle,
      `<button class="btn" id="addResource">+ Add ${esc(cfg.title.slice(0, -1))}</button>`,
    ) +
    table(
      cfg.columns,
      rows.map(
        (r) =>
          `<tr>${cfg
            .cells(r)
            .map((x) => `<td>${esc(x ?? "—")}</td>`)
            .join(
              "",
            )}<td><div class="inline-actions"><button class="btn secondary small" data-edit="${r._id}">Edit</button>${key === "markets" ? `<button class="btn secondary small" data-toggle="${r._id}">${r.active === false ? "Activate" : "Deactivate"}</button>` : ""}<button class="btn danger small" data-remove="${r._id}">Remove</button></div></td></tr>`,
      ),
    );
  if (key === "markets")
    content.insertAdjacentHTML(
      "beforeend",
      `<div class="grid three">${rows.map((m) => `<article class="card item">${imageTag(m.image, m.name, "market")}<h3>${esc(m.name)}</h3><p>${esc(m.address)}</p>${mapEmbed(m.latitude, m.longitude)}</article>`).join("")}</div>`,
    );
  $("#addResource").onclick = () => resourceForm(cfg);
  content.onclick = async (e) => {
    const edit = e.target.closest("[data-edit]"),
      toggle = e.target.closest("[data-toggle]"),
      del = e.target.closest("[data-remove]");
    if (toggle) {
      try {
        const row = rows.find(item => item._id === toggle.dataset.toggle);
        await api(`${cfg.url}/${row._id}`, { method: "PATCH", body: { active: row.active === false } });
        show(key);
      } catch (err) { toast(err.message, true); }
    }
    if (edit)
      resourceForm(
        cfg,
        rows.find((r) => r._id === edit.dataset.edit),
      );
    if (del && confirmAction(`Remove this ${key.slice(0, -1)}?`)) {
      try {
        await api(`${cfg.url}/${del.dataset.remove}`, { method: "DELETE" });
        toast("Removed");
        show(key);
      } catch (err) {
        toast(err.message, true);
      }
    }
  };
}
function resourceForm(cfg, row) {
  modal(
    `${row ? "Edit" : "Add"} ${cfg.title.slice(0, -1)}`,
    cfg.fields
      .map(([key, label, type, required]) =>
        type === "textarea"
          ? textarea(key, label, row?.[key])
          : field(
              key,
              label,
              type === "list" ? (row?.[key] || []).join(", ") : row?.[key],
              type === "number" ? "number" : "text",
              required,
            ),
      )
      .join(""),
    async (data) => {
      for (const [key, , type] of cfg.fields) {
        if (type === "list")
          data[key] = data[key]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        if (type === "number")
          data[key] = data[key] === "" ? undefined : Number(data[key]);
      }
      if (cfg.title === "Announcements") data.active = row?.active ?? true;
      if (cfg.title === "Markets") data.active = row?.active ?? true;
      await api(cfg.url + (row ? "/" + row._id : ""), {
        method: row ? "PATCH" : "POST",
        body: data,
      });
      toast("Saved");
      show(page);
    },
  );
}
async function markets() {
  return resource("markets");
}
async function categories() {
  return resource("categories");
}
async function announcements() {
  return resource("announcements");
}
async function products() {
  const [rows, farmers] = await Promise.all([
    api("/admin/products"),
    api("/admin/users?role=farmer"),
  ]);
  const names = new Map(farmers.map((f) => [f.id, f.business]));
  content.innerHTML =
    heading(
      "CONTENT MODERATION",
      "Products",
      "Review current stock and remove inappropriate listings.",
    ) +
    table(
      ["Product", "Farmer", "Category", "Price", "Stock", "Actions"],
      rows.map(
        (p) =>
          `<tr><td><strong>${esc(p.name)}</strong></td><td>${esc(names.get(String(p.farmer)) || "—")}</td><td>${esc(p.category)}</td><td>${money(p.price)} / ${esc(p.unit)}</td><td>${esc(p.stock)}</td><td><button class="btn danger small" data-remove="${p._id}">Remove listing</button></td></tr>`,
      ),
    );
  content.onclick = async (e) => {
    const btn = e.target.closest("[data-remove]");
    if (btn && confirmAction("Remove this product listing?"))
      try {
        await api(`/admin/products/${btn.dataset.remove}`, {
          method: "DELETE",
        });
        toast("Listing removed");
        show("products");
      } catch (err) {
        toast(err.message, true);
      }
  };
}
async function orders() {
  const rows = await api("/orders");
  content.innerHTML =
    heading(
      "OPERATIONS",
      "Orders",
      "All reservations across the platform; payment is at pickup.",
    ) +
    table(
      ["Order", "Customer", "Farmer", "Pickup", "Total", "Status"],
      rows.map(
        (o) =>
          `<tr><td>#${short(o.id)}</td><td>${esc(o.customer)}</td><td>${esc(o.farmerId)}</td><td>${date(o.pickupDate)}<br><small>${esc(o.pickupSlot)}</small></td><td>${money(o.total)}</td><td>${badge(o.status)}</td></tr>`,
      ),
    );
}
async function reviews() {
  const rows = await api("/admin/reviews");
  content.innerHTML =
    heading(
      "CONTENT MODERATION",
      "Reviews",
      "See each farmer's rating and moderate written feedback.",
    ) +
    table(
      [
        "Customer",
        "Farmer",
        "Review of",
        "Rating",
        "Comment",
        "Farmer reply",
        "Date",
        "Actions",
      ],
      rows.map(
        (r) =>
          `<tr><td>${esc(r.customerName)}</td><td>${esc(r.farmerName)}</td><td>${esc(r.target)}</td><td>${ratingLabel(r.rating)}</td><td>${esc(r.comment || "—")}</td><td>${esc(r.response || "—")}</td><td>${date(r.createdAt)}</td><td><button class="btn danger small" data-remove="${r._id}">Remove review</button></td></tr>`,
      ),
    );
  content.onclick = async (e) => {
    const btn = e.target.closest("[data-remove]");
    if (btn && confirmAction("Remove this review?"))
      try {
        await api(`/admin/reviews/${btn.dataset.remove}`, { method: "DELETE" });
        toast("Review removed");
        show("reviews");
      } catch (err) {
        toast(err.message, true);
      }
  };
}
async function inbox() {
  const [alerts, messages] = await Promise.all([
    api("/notifications"),
    api("/messages"),
  ]);
  content.innerHTML =
    heading(
      "PLATFORM INBOX",
      "Messages & alerts",
      "Reply to questions and review registration requests.",
    ) +
    `<div class="grid two">${messages.map((m) => `<article class="card item"><div class="section-head"><h2>${esc(m.subject)}</h2><small>${date(m.createdAt)}</small></div><p>${esc(m.message)}</p><small>${esc(m.name)} · ${esc(m.email)} ${m.order ? "· Order #" + short(m.order) : ""}</small>${m.reply ? `<div class="notice"><strong>Your reply:</strong> ${esc(m.reply)}</div>` : `<p><button class="btn secondary small" data-reply="${m._id}">Reply</button></p>`}</article>`).join("") || empty("No messages yet.")}</div>` +
    `<h2>Alerts</h2><div class="grid two">${alerts.map((n) => `<article class="card item"><div class="section-head"><h2>${esc(n.title)}</h2>${badge(n.read ? "read" : "new")}</div><p>${esc(n.message)}</p><small>${date(n.createdAt)}</small>${n.read ? "" : `<p><button class="btn secondary small" data-read="${n._id}">Mark read</button></p>`}</article>`).join("") || empty("No alerts yet.")}</div>`;
  content.onclick = async (event) => {
    const read = event.target.closest("[data-read]"),
      reply = event.target.closest("[data-reply]");
    if (read) {
      await api(`/notifications/${read.dataset.read}/read`, {
        method: "PATCH",
      });
      show("inbox");
    }
    if (reply)
      modal(
        "Reply to customer",
        textarea("reply", "Your reply"),
        async (data) => {
          await api(`/messages/${reply.dataset.reply}/reply`, {
            method: "PATCH",
            body: data,
          });
          toast("Reply sent");
          show("inbox");
        },
        "Send reply",
      );
  };
}
async function reports() {
  const r = await api("/admin/reports");
  content.innerHTML =
    heading(
      "ANALYTICS",
      "Reports",
      "Completed pickup revenue and the most active producers.",
      '<button class="btn" id="downloadReport">Download CSV report</button>',
    ) +
    `<div class="grid stats">${stat("Total farmers", r.farmers)}${stat("Customers", r.customers)}${stat("Orders", r.orders)}${stat("Completed revenue", money(r.revenue))}</div>` +
    table(
      ["Farmer", "Orders", "Completed pickup value"],
      r.activeFarmers.map(
        (f) =>
          `<tr><td>${esc(f.business || String(f._id))}</td><td>${f.orders}</td><td>${money(f.value)}</td></tr>`,
      ),
    ) +
    `<div style="height:20px"></div><h2>Revenue by market</h2>` +
    table(
      ["Market", "Completed orders", "Revenue"],
      (r.byMarket || []).map(
        (m) =>
          `<tr><td>${esc(m.name || String(m._id))}</td><td>${m.orders}</td><td>${money(m.revenue)}</td></tr>`,
      ),
    );
  $("#downloadReport").onclick = () => downloadReport(r);
}

if (user) {
  shell(user, nav, show);
  await show(location.hash.slice(1) || "overview");
}
