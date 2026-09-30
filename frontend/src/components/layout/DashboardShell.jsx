// One responsive dashboard shell for all three roles.
import { ArrowLeft, Bell, LogOut, Menu, Sprout } from "lucide-react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useApp } from "../../context/AppContext";

const dashboardMenus = {
  customer: [
    ["Overview", "/customer"],
    ["My Orders", "/customer/orders"],
    ["Notifications", "/customer/notifications"],
    ["Messages", "/customer/messages"],
    ["Favorites", "/customer/favorites"],
    ["Profile", "/customer/profile"],
  ],
  farmer: [
    ["Overview", "/farmer"],
    ["Products", "/farmer/products"],
    ["Weekly Stock", "/farmer/stock"],
    ["Orders", "/farmer/orders"],
    ["Notifications", "/farmer/notifications"],
    ["Messages", "/farmer/messages"],
    ["Pickup Slots", "/farmer/slots"],
    ["Reviews", "/farmer/reviews"],
    ["Analytics", "/farmer/analytics"],
    ["Profile", "/farmer/profile"],
  ],
  admin: [
    ["Overview", "/admin"],
    ["Farmers", "/admin/farmers"],
    ["Customers", "/admin/customers"],
    ["Markets", "/admin/markets"],
    ["Products", "/admin/products"],
    ["Categories", "/admin/categories"],
    ["Orders", "/admin/orders"],
    ["Notifications", "/admin/notifications"],
    ["Messages", "/admin/messages"],
    ["Reviews", "/admin/reviews"],
    ["Reports", "/admin/reports"],
    ["Announcements", "/admin/announcements"],
  ],
};

export default function DashboardShell({ role }) {
  const { user, logout, notifications } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const workspaceTitle = role[0].toUpperCase() + role.slice(1);

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${menuOpen ? "mobile-open" : ""}`}>
        <Link to="/" className="brand brand-light">
          <span className="brand-mark" aria-hidden="true">
            🌳
          </span>
          <span className="brand-copy">
            <strong>MarketLink</strong>
            <small>Workspace</small>
          </span>
        </Link>
        <button
          className="dash-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        >
          ×
        </button>

        <div className="sidebar-role">
          <span>{role} account</span>
          <strong>{user?.name}</strong>
        </div>

        <nav aria-label={`${workspaceTitle} dashboard`}>
          {dashboardMenus[role].map(([label, path]) => (
            <NavLink
              end={path === `/${role}`}
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/">
            <ArrowLeft size={16} />
            Public site
          </Link>

          <button onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-top">
          <div>
            <button
              className="dash-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Open navigation"
              aria-expanded={menuOpen}
            >
              <Menu size={20} />
            </button>
            <span className="mobile-brand">
              <Sprout size={18} />
              MarketLink 🌳
            </span>

            <span className="muted small">{workspaceTitle} workspace</span>
          </div>

          <div className="dashboard-user">
            <Link
              className="icon-btn with-count"
              to={`/${role}/notifications`}
              aria-label="Notifications"
            >
              <Bell size={18} />
              {notifications.some((note) => !note.read) && <i />}
            </Link>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.email}</small>
            </div>
            <div className="avatar">{user?.name?.[0] || "H"}</div>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
