import {
  ArrowRight,
  CalendarCheck,
  Leaf,
  MapPin,
  PackageCheck,
  Search,
  ShoppingBasket,
  Sparkles,
  Store,
  Truck,
} from 'lucide-react';
import { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';

import FarmerCard from '../../components/FarmerCard';
import MarketCard from '../../components/MarketCard';
import ProductCard from '../../components/ProductCard';
import SectionHeader from '../../components/common/SectionHeader';
import { useApp } from '../../context/AppContext';
import { imageProps } from '../../../../JS/images.js';
import {
  farmers,
  markets,
  products,
  marketImage,
  sampleProducts,
} from '../../data/platformData';

const categoryCards = [
  ['Fresh Produce', 'Seasonal vegetables & greens'],
  ['Dairy & Eggs', 'Milk, cheese & farm eggs'],
  ['Baked Goods', 'Sourdough & artisan loaves'],
  ['Honey & Pantry', 'Sidr honey, oils & staples'],
  ['Meat & Poultry', 'Traditional farm poultry'],
  ['Condiments', 'Small-batch pantry favourites'],
];

const howItWorks = [
  {
    icon: Search,
    number: '01',
    title: 'Discover',
    text: 'Browse weekly products, farmers and nearby markets.',
  },
  {
    icon: ShoppingBasket,
    number: '02',
    title: 'Reserve',
    text: 'Add available products to your pre-order cart.',
  },
  {
    icon: CalendarCheck,
    number: '03',
    title: 'Choose a slot',
    text: 'Select a collection window offered by the farmer.',
  },
  {
    icon: PackageCheck,
    number: '04',
    title: 'Collect & pay',
    text: 'Pick up at the market and pay the farmer directly.',
  },
];

export default function Home() {
  const { addToCart, announcements } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const navigate = useNavigate();

  function handleSearch(event) {
    event.preventDefault();

    navigate(
      `/products?search=${encodeURIComponent(searchQuery)}`
    );
  }

  return (
    <>
      <section className="hero">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow hero-eyebrow">
              <Sparkles size={14} />
              PAKISTAN'S LOCAL PRODUCERS, ONE MARKETPLACE
            </div>

            <h1>
              Fresh from Pakistan,
              <span> reserved before market day.</span>
            </h1>

            <p>
              Browse products from approved growers and local producers,
              reserve what you need, and collect from participating
              community markets without online payment.
            </p>

            <div className="hero-actions">
              <Link
                className="btn btn-primary btn-lg"
                to="/products"
              >
                Shop this week
                <ArrowRight size={17} />
              </Link>

              <Link
                className="btn btn-ghost btn-lg"
                to="/markets"
              >
                <MapPin size={17} />
                Find a market
              </Link>
            </div>

            <div className="hero-trust">
              <span>
                <strong>{farmers.length}</strong>
                approved vendors
              </span>
              <span>
                <strong>{products.length}</strong>
                weekly products
              </span>
              <span>
                <strong>{markets.length}</strong>
                market locations
              </span>
            </div>
          </div>

          <div className="hero-discovery-card">
            <div className="hero-card-topline">
              <span className="hero-location-chip">
                <MapPin size={14} />
                {markets[0]?.name || 'Local markets'}
              </span>
              <span className="hero-market-day">
                {markets[0]?.day || 'See market schedules'}
              </span>
            </div>

            <div className="hero-feature-image">
              <img
                {...imageProps(markets[0]?.image || marketImage, markets[0]?.name || 'Local markets', 'market')}
                alt="Fresh produce at a Pakistan market"
              />

              <div className="hero-feature-caption">
                <span>Market spotlight</span>
                <strong>{markets[0]?.name || 'MarketLink'}</strong>
                <small>{markets[0]?.farmers || 0} registered farmers</small>
              </div>
            </div>

            <div className="hero-pickup-summary">
              <div>
                <span className="hero-summary-label">
                  Pickup location
                </span>
                <strong>
                  {markets[0]?.address || 'Explore locations'}
                </strong>
              </div>

              <div className="hero-summary-badge">
                Pay at pickup
              </div>
            </div>

            <div className="hero-product-preview">
              <div className="hero-preview-heading">
                <span>Available weekly stock</span>
                <small>Prices in PKR</small>
              </div>

              <div className="hero-preview-grid">
                {products.slice(0, 3).map((product) => (
                  <Link
                    to={`/products/${product.id}`}
                    className="hero-preview-item"
                    key={product.id}
                  >
                    <img
                      {...imageProps(product.image, product.name, 'product', product.category)}
                      alt={product.name}
                    />
                    <span>
                      <strong>{product.name}</strong>
                      <small>
                        Rs {product.price.toLocaleString()}
                      </small>
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to={markets[0] ? `/markets/${markets[0].id}` : '/markets'}
              className="hero-card-link"
            >
              Explore market
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <form
          className="container hero-search"
          onSubmit={handleSearch}
        >
          <div className="hero-search-main">
            <Search size={18} />
            <div>
              <small>Search weekly stock</small>
              <input
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Avocado, Sidr honey, desi eggs..."
              />
            </div>
          </div>

          <div className="hero-search-meta">
            <MapPin size={17} />
            <span>Pakistan market locations</span>
          </div>

          <button className="btn btn-dark">
            Search products
          </button>
        </form>
      </section>

      <section className="trust-strip">
        <div className="container trust-strip-grid">
          <div>
            <Store size={18} />
            <span>
              <strong>Pakistani producers</strong>
              Real local vendor profiles
            </span>
          </div>

          <div>
            <Truck size={18} />
            <span>
              <strong>Reserve before pickup</strong>
              Pay directly at collection
            </span>
          </div>

          <div>
            <Leaf size={18} />
            <span>
              <strong>Local market discovery</strong>
              Browse by vendor and market
            </span>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="DISCOVER"
            title="Shop by category"
            copy="Browse fresh produce, dairy, bakery, honey and pantry products from Pakistani producers."
          />

          <div className="category-grid">
            {categoryCards.map(([category, subtitle], index) => (
              <Link
                to={`/products?category=${encodeURIComponent(
                  category
                )}`}
                key={category}
                className="category-card"
              >
                <div className="category-number">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="category-icon">
                  <Leaf size={19} />
                </div>

                <strong>{category}</strong>
                <span>{subtitle}</span>
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section soft">
        <div className="container">
          <SectionHeader
            eyebrow="FRESH THIS WEEK"
            title="Real products from Pakistani vendors"
            copy="Browse public product listings and PKR prices from Pakistan market sources."
            action={
              <Link to="/products" className="text-link">
                View all products →
              </Link>
            }
          />

          <div className="product-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
            {!products.length && sampleProducts.map(product => <article className="product-card card" key={product.id}>
              <div className="card-media"><img {...imageProps(product.image, product.name, 'product', product.category)} alt={product.name} /></div>
              <div className="card-body"><span className="eyebrow">Sample preview</span><h3>{product.name}</h3>
                <p className="muted small">Real stock appears after farmer approval and listing.</p>
                <div className="card-bottom"><strong>Rs {product.price.toLocaleString()} / {product.unit}</strong>
                  <button className="btn btn-icon" onClick={() => { addToCart(product.id); navigate('/cart'); }} aria-label={`Add ${product.name} to cart`}>+</button>
                </div>
              </div>
            </article>)}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="NEARBY MARKETS"
            title="Explore real Pakistan market locations"
            copy="Browse Islamabad weekly bazaars, community markets and a Lahore organic market listing."
            action={
              <Link to="/markets" className="text-link">
                Explore all markets →
              </Link>
            }
          />

          <div className="market-grid">
            {markets.slice(0, 3).map((market) => (
              <MarketCard
                key={market.id}
                market={market}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section deep">
        <div className="container">
          <div className="deep-heading-grid">
            <SectionHeader
              eyebrow="HOW IT WORKS"
              title="Fresh food without the guesswork"
              copy="A simple reservation flow designed around real market schedules."
            />

            <p className="deep-note">
              No online payment is needed. Your order is reserved
              against the farmer's available stock and paid for at
              collection.
            </p>
          </div>

          <div className="steps">
            {howItWorks.map((step) => {
              const Icon = step.icon;

              return (
                <div className="step" key={step.number}>
                  <span>{step.number}</span>
                  <div className="step-icon">
                    <Icon size={21} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="MEET THE PRODUCERS"
            title="Discover Pakistani growers and artisan producers"
            copy="Profiles use real vendor names and public product information from Pakistan-based market listings."
            action={
              <Link to="/farmers" className="text-link">
                Meet all producers →
              </Link>
            }
          />

          <div className="search"><select aria-label="Show farmers by market" value={selectedMarket} onChange={event => setSelectedMarket(event.target.value)}>
            <option value="">All markets</option>{markets.map(market => <option key={market.id} value={market.id}>{market.name}</option>)}
          </select></div>
          <div className="farmer-grid">
            {farmers.filter(farmer => !selectedMarket || farmer.markets.includes(selectedMarket)).slice(0, 4).map((farmer) => (
              <FarmerCard
                key={farmer.id}
                farmer={farmer}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section newsletter-section">
        <div className="container newsletter">
          <div>
            <div className="eyebrow light">
              MARKET UPDATES
            </div>
            <h2>News from MarketLink</h2>
            <p>Market days and updates shared by the admin.</p>
          </div>

          <aside className="announcement-list">
            {announcements.slice(0, 3).map(item => <article key={item._id}>
              <strong>{item.title}</strong><p>{item.message}</p>
            </article>)}
            {!announcements.length && <p>No new market updates yet.</p>}
          </aside>
        </div>
      </section>
    </>
  );
}
