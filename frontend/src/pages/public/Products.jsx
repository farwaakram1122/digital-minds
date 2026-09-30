import {
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  useMemo,
  useState,
} from 'react';
import { useSearchParams } from 'react-router-dom';

import ProductCard from '../../components/ProductCard';
import { useApp } from '../../context/AppContext';
import {
  categories,
  farmers,
  markets,
  products,
} from '../../data/platformData';

const marketDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function Products() {
  const { catalogVersion } = useApp();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState(
    searchParams.get('search') || ''
  );

  const [category, setCategory] = useState(
    searchParams.get('category') || ''
  );

  const [marketId, setMarketId] = useState('');
  const [farmerId, setFarmerId] = useState('');
  const [marketDay, setMarketDay] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('listed');
  const [availableOnly, setAvailableOnly] = useState(true);

  const visibleProducts = useMemo(() => {
    let filteredProducts = products.filter((product) => {
      const normalizedSearch = search.toLowerCase();

      const matchesSearch =
        !search ||
        product.name
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesCategory =
        !category || product.category === category;

      const matchesMarket =
        !marketId || product.marketIds.includes(marketId);

      const matchesFarmer =
        !farmerId || product.farmerId === farmerId;

      const matchesPrice =
        !maxPrice || product.price <= Number(maxPrice);

      const matchesAvailability =
        !availableOnly || product.stock > 0;

      const matchesDay =
        !marketDay ||
        product.marketIds.some((productMarketId) => {
          const market = markets.find(
            (item) => item.id === productMarketId
          );

          return market?.day.includes(marketDay);
        });

      return (
        matchesSearch &&
        matchesCategory &&
        matchesMarket &&
        matchesFarmer &&
        matchesPrice &&
        matchesAvailability &&
        matchesDay
      );
    });

    if (sortBy === 'low') {
      filteredProducts = [...filteredProducts].sort(
        (a, b) => a.price - b.price
      );
    }

    if (sortBy === 'high') {
      filteredProducts = [...filteredProducts].sort(
        (a, b) => b.price - a.price
      );
    }

    return filteredProducts;
  }, [
    search,
    category,
    marketId,
    farmerId,
    marketDay,
    maxPrice,
    sortBy,
    availableOnly,
    catalogVersion,
  ]);

  function clearFilters() {
    setSearch('');
    setCategory('');
    setMarketId('');
    setFarmerId('');
    setMarketDay('');
    setMaxPrice('');
    setSortBy('listed');
    setAvailableOnly(true);
  }

  return (
    <div className="page container">
      <div className="page-intro">
        <div className="eyebrow">WEEKLY CATALOGUE</div>
        <h1>Pakistan product catalogue</h1>
        <p>
          Browse public product names and listed prices from Pakistan
          market sources, then filter by vendor, market day, price and
          category.
        </p>
      </div>

      <div className="catalog-layout">
        <aside className="filters card">
          <div className="filters-heading">
            <h3>
              <SlidersHorizontal size={18} />
              Filters
            </h3>
            <span className="soft-count">
              {visibleProducts.length}
            </span>
          </div>

          <label>
            Search
            <div className="input-icon">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Product name"
              />
            </div>
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">All categories</option>
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            Farmer
            <select
              value={farmerId}
              onChange={(event) =>
                setFarmerId(event.target.value)
              }
            >
              <option value="">All farmers</option>
              {farmers.map((farmer) => (
                <option
                  value={farmer.id}
                  key={farmer.id}
                >
                  {farmer.business}
                </option>
              ))}
            </select>
          </label>

          <label>
            Market
            <select
              value={marketId}
              onChange={(event) =>
                setMarketId(event.target.value)
              }
            >
              <option value="">All markets</option>
              {markets.map((market) => (
                <option
                  value={market.id}
                  key={market.id}
                >
                  {market.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            Market day
            <select
              value={marketDay}
              onChange={(event) =>
                setMarketDay(event.target.value)
              }
            >
              <option value="">Any day</option>
              {marketDays.map((day) => (
                <option key={day}>{day}</option>
              ))}
            </select>
          </label>

          <label>
            Maximum price
            <select
              value={maxPrice}
              onChange={(event) =>
                setMaxPrice(event.target.value)
              }
            >
              <option value="">Any price</option>
              <option value="500">Up to Rs 500</option>
              <option value="1000">Up to Rs 1,000</option>
              <option value="2500">Up to Rs 2,500</option>
              <option value="5000">Up to Rs 5,000</option>
            </select>
          </label>

          <label>
            Sort
            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(event.target.value)
              }
            >
              <option value="listed">Default listing</option>
              <option value="low">Price low to high</option>
              <option value="high">Price high to low</option>
            </select>
          </label>

          <label className="check">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(event) =>
                setAvailableOnly(event.target.checked)
              }
            />
            Available only
          </label>

          <button
            className="btn btn-ghost full"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </aside>

        <section>
          <div className="row-between catalog-bar">
            <div>
              <strong>
                {visibleProducts.length} products
              </strong>
              <span className="muted small block-note">
                Public catalogue records with PKR pricing
              </span>
            </div>

            <span className="muted small">
              Reserve-and-pickup interface
            </span>
          </div>

          {visibleProducts.length > 0 ? (
            <div className="product-grid compact">
              {visibleProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="empty card">
              <h3>No matching products</h3>
              <p>
                Try clearing one or more filters.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
