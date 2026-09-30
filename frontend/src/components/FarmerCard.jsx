import {
  Heart,
  MapPin,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useApp } from '../context/AppContext';
import { imageProps } from '../../../JS/images.js';

export default function FarmerCard({ farmer }) {
  const {
    favorites,
    toggleFavorite,
  } = useApp();

  const isFavorite = favorites.farmers.includes(
    farmer.id
  );

  return (
    <article className="farmer-card card">
      <div className="farmer-image-wrap">
        <img
          {...imageProps(farmer.image, farmer.business, 'farmer')}
          alt={farmer.business}
        />

        <div className="farmer-image-badge">
          Pakistan vendor
        </div>
      </div>

      <div className="card-body">
        <div className="row-between">
          {farmer.rating ? (
            <span className="rating">
              <Star size={13} fill="currentColor" />
              {farmer.rating}
            </span>
          ) : (
            <span className="verified-listing">
              Approved stall
            </span>
          )}

          <button
            className={`icon-btn ${
              isFavorite ? 'active' : ''
            }`}
            onClick={() =>
              toggleFavorite('farmers', farmer.id)
            }
            aria-label="Favorite farmer"
          >
            <Heart
              size={17}
              fill={isFavorite ? 'currentColor' : 'none'}
            />
          </button>
        </div>

        <Link
          className="card-title"
          to={`/farmers/${farmer.id}`}
        >
          {farmer.business}
        </Link>

        <p className="muted small">
          <MapPin size={14} />
          {farmer.location}
        </p>

        <div className="chips">
          {farmer.categories.map((category) => (
            <span className="chip" key={category}>
              {category}
            </span>
          ))}
        </div>

        <Link
          to={`/farmers/${farmer.id}`}
          className="text-link"
        >
          View stall →
        </Link>
      </div>
    </article>
  );
}
