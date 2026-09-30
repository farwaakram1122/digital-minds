import {
  CalendarDays,
  Clock,
  Heart,
  MapPin,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useApp } from '../context/AppContext';
import { imageProps } from '../../../JS/images.js';

export default function MarketCard({ market }) {
  const {
    favorites,
    toggleFavorite,
  } = useApp();

  const isFavorite = favorites.markets.includes(
    market.id
  );

  return (
    <article className="market-card card">
      <div className="card-media">
        <img
          {...imageProps(market.image, market.name, 'market')}
          alt={`Illustrative market scene for ${market.name}`}
        />

        <button
          className={`icon-btn media-fav ${
            isFavorite ? 'active' : ''
          }`}
          onClick={() =>
            toggleFavorite('markets', market.id)
          }
          aria-label="Favorite market"
        >
          <Heart
            size={17}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>
      </div>

      <div className="card-body">
        <div className="market-card-topline">
          <span>{market.day}</span>
          <span>{market.vendorLabel || `${market.farmers} vendors`}</span>
        </div>

        <Link
          className="card-title"
          to={`/markets/${market.id}`}
        >
          {market.name}
        </Link>

        <p className="muted small">
          <MapPin size={14} />
          {market.address}
        </p>

        <div className="info-pair">
          <span>
            <CalendarDays size={14} />
            {market.day}
          </span>
          <span>
            <Clock size={14} />
            {market.hours}
          </span>
        </div>

        <div className="row-between market-card-footer">
          <span className="small muted">
            Pakistan market listing
          </span>

          <Link
            to={`/markets/${market.id}`}
            className="text-link"
          >
            Explore →
          </Link>
          {market.lat != null && market.lng != null && Number.isFinite(Number(market.lat)) && Number.isFinite(Number(market.lng)) &&
            <a href={`https://www.openstreetmap.org/?mlat=${market.lat}&mlon=${market.lng}#map=16/${market.lat}/${market.lng}`} target="_blank" rel="noopener noreferrer" className="text-link">Map pin ↗</a>}
        </div>
      </div>
    </article>
  );
}
