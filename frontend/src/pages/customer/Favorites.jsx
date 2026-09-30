import FarmerCard from '../../components/FarmerCard';
import MarketCard from '../../components/MarketCard';
import ProductCard from '../../components/ProductCard';
import { useApp } from '../../context/AppContext';
import {
  farmers,
  markets,
  products,
} from '../../data/platformData';

export default function Favorites() {
  const { favorites } = useApp();

  const savedProducts = products.filter((product) =>
    favorites.products.includes(product.id)
  );

  const savedFarmers = farmers.filter((farmer) =>
    favorites.farmers.includes(farmer.id)
  );

  const savedMarkets = markets.filter((market) =>
    favorites.markets.includes(market.id)
  );

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">SAVED</div>
          <h1>Favorites</h1>
          <p>
            Your shortlist of products, farmers and markets.
          </p>
        </div>
      </div>

      <section className="dash-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Products</span>
            <h2>Saved products</h2>
          </div>
          <span className="soft-count">{savedProducts.length}</span>
        </div>

        {savedProducts.length > 0 ? (
          <div className="product-grid compact">
            {savedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="empty card">
            <h3>No saved products yet</h3>
            <p>
              Save products while browsing to find them here.
            </p>
          </div>
        )}
      </section>

      <section className="dash-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Producers</span>
            <h2>Saved farmers</h2>
          </div>
          <span className="soft-count">{savedFarmers.length}</span>
        </div>

        {savedFarmers.length > 0 ? (
          <div className="farmer-grid">
            {savedFarmers.map((farmer) => (
              <FarmerCard
                key={farmer.id}
                farmer={farmer}
              />
            ))}
          </div>
        ) : (
          <div className="empty card">
            <h3>No saved farmers yet</h3>
            <p>
              Favorite a farmer to keep their weekly stock close.
            </p>
          </div>
        )}
      </section>

      <section className="dash-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Pickup</span>
            <h2>Saved markets</h2>
          </div>
          <span className="soft-count">{savedMarkets.length}</span>
        </div>

        {savedMarkets.length > 0 ? (
          <div className="market-grid">
            {savedMarkets.map((market) => (
              <MarketCard
                key={market.id}
                market={market}
              />
            ))}
          </div>
        ) : (
          <div className="empty card">
            <h3>No saved markets yet</h3>
            <p>
              Save a market to quickly return to its pickup details.
            </p>
          </div>
        )}
      </section>
    </>
  );
}
