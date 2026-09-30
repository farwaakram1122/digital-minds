// Shared HTML panel helpers: escaping, API calls, navigation and alerts.
import { ratingLabel, reviewRatings } from "./reviewRatings.js";
import { imageFallback, imageSource } from "./images.js";
export { ratingLabel, reviewRatings };

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [
  ...root.querySelectorAll(selector),
];
export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
export const money = (n) => `Rs ${Number(n || 0).toLocaleString("en-PK")}`;
// Every product and stall card has an image when a URL is empty or broken.
export const imageTag = (src, name, kind = "product", category = "", attributes = "") =>
  `<img src="${esc(imageSource(src, name, kind, category))}" data-fallback="${esc(imageFallback(name, kind, category))}" alt="${esc(name)}" loading="lazy" ${attributes}>`;
document.addEventListener("error", event => {
  const img = event.target;
  if (img instanceof HTMLImageElement && img.dataset.fallback) {
    const fallback = img.dataset.fallback;
    delete img.dataset.fallback;
    img.src = fallback;
  }
}, true);
export const short = (id) =>
  String(id || "")
    .slice(-7)
    .toUpperCase();
export const date = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-PK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";
export const badge = (value) =>
  `<span class="badge ${esc(value)}">${esc(value === "ready" ? "Ready for pickup" : value)}</span>`;
export const empty = (message) =>
  `<div class="card empty">${esc(message)}</div>`;
export const heading = (eyebrow, title, description = "", action = "") =>
  `<div class="heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(description)}</p></div>${action}</div>`;
export const stat = (title, value, note = "") =>
  `<div class="card stat"><small>${esc(title)}</small><strong>${esc(value)}</strong><em>${esc(note)}</em></div>`;
export const field = (
  name,
  label,
  value = "",
  type = "text",
  required = false,
) =>
  `<label class="field">${esc(label)}<input name="${esc(name)}" type="${type}" ${type === "number" ? 'step="any"' : ""} value="${esc(value)}" ${required ? "required" : ""}></label>`;
export const textarea = (name, label, value = "") =>
  `<label class="field span-2">${esc(label)}<textarea name="${esc(name)}">${esc(value)}</textarea></label>`;
export const select = (name, label, options, value = "") =>
  `<label class="field">${esc(label)}<select name="${esc(name)}">${options
    .map((o) => {
      const [id, text] = Array.isArray(o) ? o : [o, o];
      return `<option value="${esc(id)}" ${String(id) === String(value) ? "selected" : ""}>${esc(text)}</option>`;
    })
    .join("")}</select></label>`;
export const table = (columns, rows) =>
  `<div class="card table-wrap"><table class="table"><thead><tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${columns.length}" class="empty">No records yet.</td></tr>`}</tbody></table></div>`;
export const formData = (form) => Object.fromEntries(new FormData(form));
export function toast(message, error = false) {
  $("#toastHost").innerHTML =
    `<div class="toast ${error ? "error-toast" : ""}" role="status">${esc(message)}</div>`;
  setTimeout(() => {
    $("#toastHost").innerHTML = "";
  }, 4000);
}
export function modal(title, fields, onSubmit, submitText = "Save") {
  const host = $("#overlay");
  host.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle"><header><h2 id="modalTitle">${esc(title)}</h2><button type="button" class="close" data-close aria-label="Close">×</button></header><form id="modalForm"><div class="form-grid">${fields}</div><footer><button type="button" class="btn secondary" data-close>Cancel</button><button type="submit" class="btn">${esc(submitText)}</button></footer></form></section></div>`;
  $$("[data-close]", host).forEach((b) =>
    b.addEventListener("click", closeModal),
  );
  $(".modal-backdrop", host).addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-backdrop")) closeModal();
  });
  $("#modalForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button[type=submit]", e.currentTarget);
    btn.disabled = true;
    try {
      await onSubmit(formData(e.currentTarget));
      closeModal();
    } catch (err) {
      toast(err.message, true);
    } finally {
      btn.disabled = false;
    }
  });
}
export function closeModal() {
  $("#overlay").innerHTML = "";
}
export function confirmAction(message) {
  return window.confirm(message);
}
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("ml_token");
  const response = await fetch("/api" + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw Error(data.error || `Request failed: ${response.status}`);
  return data;
}
export async function uploadProductImage(file) {
  const form = new FormData();
  form.append("image", file);
  const response = await fetch("/api/farmer/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem("ml_token") || ""}`,
    },
    body: form,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Error(data.error || "Image upload failed");
  return data.image;
}
export async function guard(role) {
  try {
    const user = await api("/auth/me");
    if (user.role !== role) {
      location.replace(`/panels/${user.role}.html`);
      return null;
    }
    return user;
  } catch {
    sessionStorage.removeItem("ml_token");
    location.replace(
      role === "admin" ? "/panels/admin-login.html" : "/panels/login.html",
    );
    return null;
  }
}
// One notifications page is shared by all three HTML panels.
export async function notificationsPage(content, reload) {
  const rows = await api("/notifications");
  content.innerHTML =
    heading(
      "ACTIVITY",
      "Notifications",
      "Orders, messages and platform updates appear here.",
    ) +
    `<div class="grid">${rows.length ? rows.map((n) => `<article class="card item"><div class="section-head"><h2>${esc(n.title)}</h2>${n.read ? badge("read") : `<button class="btn secondary small" data-read="${n._id}">Mark read</button>`}</div><p>${esc(n.message)}</p><small>${date(n.createdAt)}</small></article>`).join("") : empty("No notifications yet.")}</div>`;
  content.onclick = async (event) => {
    const button = event.target.closest("[data-read]");
    if (button) {
      await api(`/notifications/${button.dataset.read}/read`, {
        method: "PATCH",
      });
      reload();
    }
  };
}
export function shell(user, items, onNavigate) {
  $("#avatar").textContent = (user.business ||
    user.name ||
    "M")[0].toUpperCase();
  $("#nav").innerHTML =
    items
      .map(
        ([key, label, icon]) =>
          `<button data-page="${key}"><span aria-hidden="true">${icon}</span>${esc(label)}</button>`,
      )
      .join("") +
    '<div class="nav-label">OTHER</div><button id="signOut"><span>↩</span> Sign out</button>';
  $("#nav").addEventListener("click", (e) => {
    const b = e.target.closest("[data-page]");
    if (b) {
      onNavigate(b.dataset.page);
      $("#sidebar").classList.remove("open");
    }
  });
  $("#signOut").addEventListener("click", async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } finally {
      sessionStorage.removeItem("ml_token");
      location.href =
        user.role === "admin"
          ? "/panels/admin-login.html"
          : "/panels/login.html";
    }
  });
  $("#menu").addEventListener("click", () =>
    $("#sidebar").classList.toggle("open"),
  );
  const role = user.role;
  $("#quickAlerts").addEventListener("click", () =>
    onNavigate("notifications"),
  );
  let latest,
    initialized = false;
  const poll = async () => {
    if (document.hidden) return;
    try {
      const alerts = await api("/notifications");
      const unread = alerts.filter((a) => !a.read).length;
      const button = $("#quickAlerts");
      button.textContent = "◉";
      if (unread) button.dataset.count = unread > 99 ? "99+" : String(unread);
      else delete button.dataset.count;
      button.title = `${unread} unread notifications`;
      button.setAttribute("aria-label", button.title);
      if (initialized && alerts[0] && alerts[0]._id !== latest) {
        toast(alerts[0].title);
        if (["notifications", "inbox"].includes(location.hash.slice(1)))
          onNavigate(location.hash.slice(1));
      }
      latest = alerts[0]?._id;
      initialized = true;
    } catch {}
  };
  poll();
  setInterval(poll, 5000);
  const search = $("#globalSearch");
  search.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const target =
      role === "customer"
        ? "products"
        : role === "farmer"
          ? "products"
          : "farmers";
    onNavigate(target);
    setTimeout(() => {
      const local = $("#productQuery") || $("#adminQuery");
      if (local) {
        local.value = search.value;
        local.dispatchEvent(new Event("input", { bubbles: true }));
        local.focus();
      }
    }, 100);
  });
  const theme = localStorage.getItem("ml_theme");
  if (theme === "dark") document.documentElement.classList.add("dark");
  $("#themeToggle").addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    localStorage.setItem(
      "ml_theme",
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
  });
}
export function active(page, title) {
  $$("[data-page]").forEach((b) =>
    b.classList.toggle("active", b.dataset.page === page),
  );
  $("#topTitle").textContent = title;
  $("#breadcrumb").textContent = `MarketLink / ${title}`;
  location.hash = page;
}
export const hero = (kicker, title, copy, actionLabel = "", actionPage = "") =>
  `<section class="hero"><div><div class="eyebrow">${esc(kicker)}</div><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>${actionLabel ? `<button type="button" data-hero-page="${esc(actionPage)}">${esc(actionLabel)} →</button>` : ""}</section>`;
export const barChart = (values, labels) => {
  const max = Math.max(1, ...values);
  return `<div class="chart-bars" role="img" aria-label="Activity chart">${values.map((value, index) => `<div class="chart-col"><small>${esc(value)}</small><b style="height:${Math.max(5, Math.round((value / max) * 135))}px"></b><span>${esc(labels[index])}</span></div>`).join("")}</div>`;
};
export const donut = (part, total, label) => {
  const percent = total ? Math.round((part / total) * 100) : 0;
  return `<div class="donut-wrap"><div class="donut" style="--slice:${percent}%"><div class="donut-inner"><div><strong>${percent}%</strong><small>${esc(label)}</small></div></div></div><div class="legend"><span><i></i>${esc(label)}: ${part}</span><span><i class="light"></i>Other: ${Math.max(0, total - part)}</span></div></div>`;
};
export const mapEmbed = (lat, lng) =>
  Number.isFinite(Number(lat)) &&
  Number.isFinite(Number(lng)) &&
  lat != null &&
  lng != null
    ? `<iframe class="mini-map" loading="lazy" title="OpenStreetMap location" src="https://www.openstreetmap.org/export/embed.html?bbox=${Number(lng) - 0.012}%2C${Number(lat) - 0.008}%2C${Number(lng) + 0.012}%2C${Number(lat) + 0.008}&amp;layer=mapnik&amp;marker=${Number(lat)}%2C${Number(lng)}"></iframe><a class="btn secondary small" target="_blank" rel="noopener" href="https://www.openstreetmap.org/directions?to=${Number(lat)}%2C${Number(lng)}">Open directions ↗</a>`
    : '<p class="muted">Location pin not set yet.</p>';
