import {
  Leaf,
  MapPin,
  ShoppingBasket,
  Users,
} from 'lucide-react';
import { farmers, markets, products } from '../../data/platformData';
import { useApp } from '../../context/AppContext';

export default function About() {
  useApp();
  const platformStats = [
  {
    icon: Users,
    value: farmers.length,
    label: 'Producer profiles',
  },
  {
    icon: MapPin,
    value: markets.length,
    label: 'Pakistan markets',
  },
  {
    icon: ShoppingBasket,
    value: products.length,
    label: 'Public product listings',
  },
  {
    icon: Leaf,
    value: '0',
    label: 'Online payments required',
  },
  ];
  return (
    <div className="page">
      <div className="container split-hero">
        <div>
          <div className="eyebrow">ABOUT MARKETLINK 🌳</div>
          <h1>
            A practical bridge between local growers and local customers.
          </h1>
          <p className="lead">
            MarketLink 🌳 helps customers see what is available before
            travelling to market, while giving farmers a simple way to
            manage limited weekly stock and collection slots. The Digital Minds
            team built the platform around local pickup and direct contact.
          </p>
        </div>

        <img
          src="https://images.pexels.com/photos/12211158/pexels-photo-12211158.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Fresh vegetables at a market in Faisalabad, Pakistan"
        />
      </div>

      <section className="section about-story-section">
        <div className="container about-story-grid">
          <div className="about-story-copy">
            <span className="section-kicker">Our story</span>
            <h2>Built around the way Pakistan's local markets already work.</h2>
            <p>
              MarketLink 🌳 started from a simple problem: customers often
              reach a market without knowing which producers are attending,
              what is still in stock, or whether the items they need will be
              available when they arrive.
            </p>
            <p>
              The platform keeps the familiar market experience intact while
              making it easier to plan ahead. Customers can discover products,
              reserve limited weekly stock and choose a pickup window. Farmers
              keep control of their availability, pricing and collection times,
              while payment still happens directly at pickup.
            </p>

            <div className="about-story-points">
              <div>
                <strong>Know before you go</strong>
                <span>See weekly availability before travelling to market.</span>
              </div>
              <div>
                <strong>Keep trade local</strong>
                <span>Connect customers directly with local producers.</span>
              </div>
              <div>
                <strong>Simple pickup</strong>
                <span>Reserve online, collect locally and pay at pickup.</span>
              </div>
            </div>
          </div>

          <div className="about-story-visual">
            <img
              src="https://images.pexels.com/photos/12211158/pexels-photo-12211158.jpeg?auto=compress&cs=tinysrgb&w=1200"
              alt="Fresh produce at a local market in Pakistan"
            />
            <div className="about-story-note">
              <span>MarketLink 🌳</span>
              <strong>Local produce. Clear availability. Easy pickup.</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <div className="stat-strip">
            {platformStats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div key={stat.label}>
                  <Icon size={22} />
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container content-grid">
          <div className="editorial-card">
            <span className="section-kicker">Our mission</span>
            <h2>Make market shopping more predictable.</h2>
            <p>
              Customers can discover weekly availability, reserve items
              and choose a pickup window before leaving home.
            </p>
          </div>

          <div className="editorial-card">
            <span className="section-kicker">For farmers</span>
            <h2>Simple tools around real market routines.</h2>
            <p>
              Farmers can publish changing stock, manage pre-orders,
              configure pickup windows and review order activity without
              needing a full delivery operation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
