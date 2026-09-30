// Reusable contact and reply view for the three panels.
import {
  $,
  api,
  heading,
  field,
  textarea,
  select,
  esc,
  empty,
  date,
  modal,
  toast,
} from "./core.js";

export async function messagesPage(user, content, refresh) {
  const [messages, orders, farmers] = await Promise.all([
    api("/messages"),
    api("/orders"),
    user.role === "customer" ? api("/farmers") : Promise.resolve([]),
  ]);
  const targets =
    user.role === "customer"
      ? [
          ["admin", "Platform admin"],
          ["farmer", "Farmer"],
        ]
      : user.role === "farmer"
        ? [
            ["admin", "Platform admin"],
            ["customer", "Order customer"],
          ]
        : [];
  content.innerHTML =
    heading(
      "CONVERSATIONS",
      "Messages",
      "Questions and replies stay linked to your account and order.",
    ) +
    (targets.length
      ? `<form id="contactForm" class="card form-grid" style="margin-bottom:20px">
      ${select("target", "Send to", targets)}
      ${select("orderId", "Order (optional for admin)", [["", "General question"], ...orders.map((o) => [o.id, `#${o.id.slice(-7).toUpperCase()} · ${o.items.map((i) => i.name).join(", ")}`])])}
      ${user.role === "customer" ? select("farmerId", "Farmer for general questions", [["", "Choose a farmer"], ...farmers.map((f) => [f.id, f.business || f.name])]) : ""}
      ${field("subject", "Subject", "", "text", true)}
      ${textarea("message", "Your message")}
      <div class="span-2"><button class="btn">Send message</button></div>
    </form>`
      : "") +
    `<div class="grid two">${
      messages
        .map(
          (m) => `<article class="card item">
      <div class="section-head"><h2>${esc(m.subject)}</h2><small>${date(m.createdAt)}</small></div>
      <p>${esc(m.message)}</p><small>${m.order ? `Order #${String(m.order).slice(-7).toUpperCase()} · ` : ""}${String(m.recipient) === String(user.id) ? `From ${esc(m.name)} (${esc(m.email)})` : "Sent by you"}</small>
      ${m.reply ? `<div class="notice"><strong>Reply:</strong> ${esc(m.reply)}</div>` : String(m.recipient) === String(user.id) ? `<p><button class="btn secondary small" data-reply="${m._id}">Reply</button></p>` : ""}
    </article>`,
        )
        .join("") || empty("No messages yet.")
    }</div>`;
  const form = $("#contactForm");
  if (form)
    form.onsubmit = async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      if (data.target === "customer" && !data.orderId)
        return toast("Choose an order to contact its customer", true);
      if (data.target === "farmer" && !data.orderId && !data.farmerId)
        return toast("Choose a farmer or order", true);
      try {
        await api("/contact", {
          method: "POST",
          body: { ...data, name: user.name, email: user.email },
        });
        toast("Message sent");
        refresh();
      } catch (error) {
        toast(error.message, true);
      }
    };
  content.onclick = (event) => {
    const button = event.target.closest("[data-reply]");
    if (button)
      modal(
        "Reply to message",
        textarea("reply", "Your reply"),
        async (data) => {
          await api(`/messages/${button.dataset.reply}/reply`, {
            method: "PATCH",
            body: data,
          });
          toast("Reply sent");
          refresh();
        },
        "Send reply",
      );
  };
}
