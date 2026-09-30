import {
  MapPin,
  Search,
} from 'lucide-react';
import {
  useMemo,
  useState,
} from 'react';

import MarketCard from '../../components/MarketCard';
import MapEmbed from '../../components/common/MapEmbed';
import { useApp } from '../../context/AppContext';
import { markets } from '../../data/platformData';

const marketDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function Markets() {
  const { catalogVersion } = useApp();
  const [search, setSearch] = useState('');
  const [day, setDay] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');

  function distance(market) {
    if (!location || market.lat == null || market.lng == null) return Infinity;
    const radians = Math.PI / 180;
    const latitude = (market.lat - location.latitude) * radians;
    const longitude = (market.lng - location.longitude) * radians;
    const haversine = Math.sin(latitude / 2) ** 2 +
      Math.cos(location.latitude * radians) * Math.cos(market.lat * radians) * Math.sin(longitude / 2) ** 2;
    return 12742 * Math.asin(Math.sqrt(haversine));
  }

  function locate() {
    if (!navigator.geolocation) {
      setLocationError('Location unavailable. Search by city instead.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setLocation({ latitude: coords.latitude, longitude: coords.longitude }); setLocationError(''); },
      () => setLocationError('Location unavailable. Search by city instead.'),
    );
  }

  const visibleMarkets = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    const results = markets.filter((market) => {
      const matchesSearch =
        !search ||
        market.name
          .toLowerCase()
          .includes(normalizedSearch) ||
        market.address
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesDay =
        !day || market.day?.includes(day);

      return matchesSearch && matchesDay;
    });
    return location ? results.sort((a, b) => distance(a) - distance(b)) : results;
  }, [search, day, location, catalogVersion]);

  const mapMarket = visibleMarkets[0];

  return (
    <div className="page container">
      <div className="page-intro row-between top">
        <div>
          <div className="eyebrow">PLAN YOUR PICKUP</div>
          <h1>Farmers markets</h1>
          <p>
            Browse by location and market day, then see the farmers
            and products attending.
          </p>
        </div>

        <div className="inline-actions">
          <button className="btn btn-ghost" onClick={() => setShowMap(current => !current)}>
            <MapPin size={17} />{showMap ? 'Card view' : 'Map view'}
          </button>
          <button className="btn btn-ghost" onClick={locate}>Nearest to me</button>
        </div>
      </div>
      {locationError && <p className="warning-note" role="status">{locationError}</p>}

      <div className="toolbar card">
        <div className="input-icon">
          <Search size={16} />
          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Market or city"
          />
        </div>

        <select
          value={day}
          onChange={(event) =>
            setDay(event.target.value)
          }
        >
          <option value="">Any market day</option>
          {marketDays.map((marketDay) => (
            <option key={marketDay}>
              {marketDay}
            </option>
          ))}
        </select>

        <span className="muted small">
          {visibleMarkets.length} locations
        </span>
      </div>

      {visibleMarkets.length === 0 ? (
        <div className="empty card">
          <h3>No markets found</h3>
          <p>
            Try another day or location.
          </p>
        </div>
      ) : showMap ? (
        <div className="map-list">
          <MapEmbed
            lat={mapMarket?.lat || 51.45}
            lng={mapMarket?.lng || -2.58}
            title="Market map"
          />

          <div>
            {visibleMarkets.map((market) => (
              <MarketCard
                market={market}
                key={market.id}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="market-grid large">
          {visibleMarkets.map((market) => (
            <MarketCard
              market={market}
              key={market.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
