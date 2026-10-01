// Login and registration forms share the same API validation.
import { api, $, formData, esc } from "./core.js";
const login = $("#loginForm");
if (login)
  login.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = formData(login);
    const button = $("button", login);
    button.disabled = true;
    try {
      const admin = login.dataset.admin === "true";
      const result = await api("/auth/login", {
        method: "POST",
        body: { ...data, area: admin ? "admin" : "public" },
      });
      sessionStorage.setItem("ml_token", result.token);
      location.href = `/panels/${result.user.role}.html`;
    } catch (err) {
      $("#message").innerHTML = `<div class="error">${esc(err.message)}</div>`;
    } finally {
      button.disabled = false;
    }
  });
const role = $("#role");
if (role)
  role.addEventListener("change", () => {
    const farmer = role.value === "farmer";
    $(".farmer-only").hidden = !farmer;
    $("input[name=business]").required = farmer;
  });
const register = $("#registerForm");
if (register)
  register.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = formData(register);
    if (data.password !== data.confirm) {
      $("#message").innerHTML =
        '<div class="error">Passwords do not match.</div>';
      return;
    }
    delete data.confirm;
    try {
      const result = await api("/auth/register", {
        method: "POST",
        body: data,
      });
      $("#message").innerHTML =
        `<div class="notice">${esc(result.message)} <a href="/panels/login.html">Sign in →</a></div>`;
      register.reset();
      $(".farmer-only").hidden = true;
    } catch (err) {
      $("#message").innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  });
const setup = $("#setupForm");
if (setup)
  setup.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = formData(setup);
    const key = data.setupKey;
    delete data.setupKey;
    try {
      await api("/auth/admin/setup", {
        method: "POST",
        headers: { "x-setup-key": key },
        body: data,
      });
      $("#message").innerHTML =
        '<div class="notice">Admin created. <a href="/panels/admin-login.html">Sign in →</a></div>';
      setup.reset();
    } catch (err) {
      $("#message").innerHTML = `<div class="error">${esc(err.message)}</div>`;
    }
  });
