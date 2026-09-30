// Public navigation and search use the live catalogue.
import { Bell, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";

import { farmers, markets, products } from "../../data/platformData";
import { useApp } from "../../context/AppContext";
import { panelUrl } from "../../services/api";

const navigationItems = [
  ["Home", "/"],
  ["Products", "/products"],
  ["Farmers", "/farmers"],
  ["Markets", "/markets"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["FAQ", "/faq"],
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const { cart, user, notifications, logout, catalogVersion } = useApp();

  const searchResults = useMemo(() => {
    if (searchQuery.trim().length < 2) {
      return [];
    }

    const normalizedQuery = searchQuery.toLowerCase();

    const productResults = products
      .filter((product) => product.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 3)
      .map((product) => ({
        label: product.name,
        to: `/products/${product.id}`,
        type: "Product",
      }));

    const farmerResults = farmers
      .filter((farmer) =>
        farmer.business.toLowerCase().includes(normalizedQuery),
      )
      .slice(0, 2)
      .map((farmer) => ({
        label: farmer.business,
        to: `/farmers/${farmer.id}`,
        type: "Farmer",
      }));

    const marketResults = markets
      .filter((market) => market.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 2)
      .map((market) => ({
        label: market.name,
        to: `/markets/${market.id}`,
        type: "Market",
      }));

    return [...productResults, ...farmerResults, ...marketResults];
  }, [searchQuery, catalogVersion]);

  const dashboardPath = user ? `/${user.role}` : "/login";

  const cartCount = cart.reduce((total, item) => total + item.qty, 0);

  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.read,
  );

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <Link className="brand" to="/">
            <span className="brand-mark" aria-hidden="true">
              🌳
            </span>
            <span className="brand-copy">
              <strong>MarketLink</strong>
              <small>Local market</small>
            </span>
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            {navigationItems.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="nav-actions">
            <button
              className="icon-btn hide-narrow"
              onClick={() => setSearchOpen((current) => !current)}
              aria-label="Search"
            >
              <Search size={18} />
            </button>

            <Link
              className="icon-btn hide-narrow"
              to="/customer/favorites"
              aria-label="Favorites"
            >
              <Heart size={18} />
            </Link>

            <Link className="icon-btn with-count" to="/cart" aria-label="Cart">
              <ShoppingBag size={18} />
              {cartCount > 0 && <span>{cartCount}</span>}
            </Link>

            {user && (
              <Link
                className="icon-btn with-count hide-mobile"
                to={`/${user.role}/notifications`}
                aria-label="Notifications"
              >
                <Bell size={18} />
                {hasUnreadNotifications && <i />}
              </Link>
            )}

            {user ? (
              <div className="user-menu">
                <Link
                  to={dashboardPath}
                  className="avatar"
                  aria-label="Dashboard"
                >
                  {user.name[0]}
                </Link>

                <button className="link-btn hide-mobile" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <a
                className="btn btn-primary hide-mobile"
                href={panelUrl("login")}
              >
                <User size={16} />
                Login
              </a>
            )}

            <button
              className="icon-btn mobile-menu"
              onClick={() => setMobileMenuOpen((current) => !current)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <div className="search-panel">
            <div className="container search-box">
              <Search size={18} />

              <input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products, farmers or markets..."
              />

              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map((result) => (
                    <Link key={result.to} to={result.to} onClick={closeSearch}>
                      <span>{result.label}</span>
                      <small>{result.type}</small>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen && (
        <div className="mobile-nav">
          {navigationItems.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </NavLink>
          ))}

          {user ? (
            <NavLink
              to={dashboardPath}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
          ) : (
            <a href={panelUrl("login")}>Login</a>
          )}
        </div>
      )}
    </>
  );
}
