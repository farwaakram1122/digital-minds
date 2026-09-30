import { Search } from 'lucide-react';
import {
  useMemo,
  useState,
} from 'react';

import FarmerCard from '../../components/FarmerCard';
import { useApp } from '../../context/AppContext';
import {
  categories,
  farmers,
  markets,
} from '../../data/platformData';

const operatingDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function Farmers() {
  const { catalogVersion } = useApp();
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('');
  const [category, setCategory] = useState('');
  const [marketId, setMarketId] = useState('');

  const visibleFarmers = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return farmers.filter((farmer) => {
      const matchesSearch =
        !search ||
        farmer.business
          .toLowerCase()
          .includes(normalizedSearch) ||
        farmer.location
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDay =
        !day || farmer.days.includes(day);

      const matchesCategory =
        !category || farmer.categories.includes(category);

      const matchesMarket =
        !marketId || farmer.markets.includes(marketId);

      return (
        matchesSearch &&
        matchesDay &&
        matchesCategory &&
        matchesMarket
      );
    });
  }, [
    search,
    day,
    category,
    marketId,
    catalogVersion,
  ]);

  return (
    <div className="page container">
      <div className="page-intro">
        <div className="eyebrow">LOCAL PRODUCERS</div>
        <h1>Meet the farmers</h1>
        <p>
          Explore profiles, weekly availability, market days and
          pickup locations.
        </p>
      </div>

      <div className="toolbar farmer-toolbar card">
        <div className="input-icon">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Farmer or location"
          />
        </div>

        <select
          value={category}
          onChange={(event) =>
            setCategory(event.target.value)
          }
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

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

        <select
          value={day}
          onChange={(event) =>
            setDay(event.target.value)
          }
        >
          <option value="">Any day</option>
          {operatingDays.map((operatingDay) => (
            <option key={operatingDay}>
              {operatingDay}
            </option>
          ))}
        </select>

        <span className="muted small">
          {visibleFarmers.length} farmers
        </span>
      </div>

      {visibleFarmers.length > 0 ? (
        <div className="farmer-grid large">
          {visibleFarmers.map((farmer) => (
            <FarmerCard
              key={farmer.id}
              farmer={farmer}
            />
          ))}
        </div>
      ) : (
        <div className="empty card">
          <h3>No farmers match these filters</h3>
          <p>
            Try another category, market or operating day.
          </p>
        </div>
      )}
    </div>
  );
}
