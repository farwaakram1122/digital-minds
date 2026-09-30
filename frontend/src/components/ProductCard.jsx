import {
  Heart,
  Plus,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import {
  farmers,
  markets,
} from '../data/platformData';
import { useApp } from '../context/AppContext';
import { imageProps } from '../../../JS/images.js';

export default function ProductCard({ product }) {
  const {
    addToCart,
    favorites,
    toggleFavorite,
  } = useApp();

  const farmer = farmers.find(
    (item) => item.id === product.farmerId
  );

  const market = markets.find((item) =>
    product.marketIds.includes(item.id)
  );

  const isFavorite = favorites.products.includes(
    product.id
  );

  return (
    <article className="product-card card">
      <div className="card-media">
        <Link to={`/products/${product.id}`}>
          <img
            {...imageProps(product.image, product.name, 'product', product.category)}
            alt={product.name}
          />
        </Link>

        <button
          aria-label="Favorite product"
          className={`icon-btn media-fav ${
            isFavorite ? 'active' : ''
          }`}
          onClick={() =>
            toggleFavorite('products', product.id)
          }
        >
          <Heart
            size={18}
            fill={isFavorite ? 'currentColor' : 'none'}
          />
        </button>

        <span className="stock-pill">
          {product.stock === 0 ? 'Sold out' : product.stock <= 5 ? 'Low stock' : 'Weekly pre-order'}
        </span>
      </div>

      <div className="card-body">
        <div className="row-between small">
          <span className="eyebrow normal-case">
            {product.category}
          </span>

          {product.rating ? (
            <span className="rating">
              <Star size={13} fill="currentColor" />
              {product.rating}
            </span>
          ) : (
            <span className="verified-listing">
              Public listing
            </span>
          )}
        </div>

        <Link
          className="card-title"
          to={`/products/${product.id}`}
        >
          {product.name}
        </Link>

        <Link
          className="muted small link"
          to={`/farmers/${farmer.id}`}
        >
          {farmer.business}
        </Link>

        <div className="muted tiny">
          Pickup · {market?.name}
        </div>

        <div className="card-bottom">
          <div>
            <strong>
              Rs {product.price.toLocaleString()}
            </strong>
            <span className="muted small">
              {' '}/ {product.unit}
            </span>
          </div>

          <button
            className="btn btn-icon"
            onClick={() => addToCart(product.id)}
            disabled={product.stock === 0}
            aria-label={`Add ${product.name} to cart`}
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </article>
  );
}
