import { CalendarDays, Clock, Heart, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import FarmerCard from "../../components/FarmerCard";
import ProductCard from "../../components/ProductCard";
import MapEmbed from "../../components/common/MapEmbed";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { ratingLabel } from "../../../../JS/reviewRatings.js";
import { farmers, markets, products } from "../../data/platformData";
import { imageProps } from "../../../../JS/images.js";

export default function MarketDetails() {
  const { id } = useParams();
  const { favorites, toggleFavorite, catalogVersion } = useApp();
  const [reviews, setReviews] = useState([]);

  const market = markets.find((item) => item.id === id);
  useEffect(() => {
    if (market?._id)
      api(`/reviews?market=${market._id}`)
        .then(setReviews)
        .catch(console.error);
  }, [market?._id, catalogVersion]);

  if (!market) {
    return (
      <div className="page container">
        <div className="empty card">
          <h1>Market not found</h1>
          <p>The market you requested is not available.</p>
        </div>
      </div>
    );
  }

  const marketFarmers = farmers.filter((farmer) =>
    farmer.markets.includes(market.id),
  );

  const marketProducts = products.filter((product) =>
    product.marketIds.includes(market.id),
  );

  const isFavorite = favorites.markets.includes(market.id);

  return (
    <div className="page container">
      <div className="market-hero">
        <img {...imageProps(market.image, market.name, 'market')} alt={market.name} />

        <div className="market-overlay">
          <div className="eyebrow light">MARKET PROFILE</div>
          <h1>{market.name}</h1>

          <div className="profile-meta">
            <span>
              <MapPin size={16} />
              {market.address}
            </span>
            <span>
              <CalendarDays size={16} />
              {market.day}
            </span>
            <span>
              <Clock size={16} />
              {market.hours}
            </span>
          </div>

          <button
            className="btn btn-light"
            onClick={() => toggleFavorite("markets", market.id)}
          >
            <Heart size={17} />
            {isFavorite ? "Saved market" : "Save market"}
          </button>
        </div>
      </div>

      <section className="detail-sections">
        <div className="card padded">
          <span className="section-kicker">Directions</span>
          <h2>Location & pickup</h2>
          <p>
            The map uses the public market or contact location. Exact collection
            details can be selected during the reservation flow.
          </p>

          <MapEmbed lat={market.lat} lng={market.lng} title={market.name} />
          {market.lat != null && market.lng != null && <a className="text-link" href={`https://www.openstreetmap.org/directions?to=${market.lat}%2C${market.lng}`} target="_blank" rel="noopener noreferrer">Directions to market ↗</a>}
        </div>

        <div className="card padded">
          <span className="section-kicker">Schedule</span>
          <h2>Market information</h2>

          <div className="info-list">
            <p>
              <strong>Operating day</strong>
              <span>{market.day}</span>
            </p>
            <p>
              <strong>Hours</strong>
              <span>{market.hours}</span>
            </p>
            <p>
              <strong>Producer profiles</strong>
              <span>{marketFarmers.length}</span>
            </p>
            <p>
              <strong>Categories</strong>
              <span>{market.categories.join(", ")}</span>
            </p>
            <p>
              <strong>Source</strong>
              <span>{market.source}</span>
            </p>
          </div>
        </div>
      </section>

      <section className="section inner">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Producers</span>
            <h2>Producer and vendor profiles</h2>
          </div>
        </div>

        <div className="farmer-grid">
          {marketFarmers.map((farmer) => (
            <FarmerCard key={farmer.id} farmer={farmer} />
          ))}
        </div>
      </section>

      <section className="section inner">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Catalogue</span>
            <h2>Public product listings</h2>
          </div>
        </div>

        <div className="product-grid compact">
          {marketProducts.slice(0, 8).map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </section>
      <section className="section inner">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Feedback</span>
            <h2>Market service reviews</h2>
          </div>
        </div>
        <div className="order-cards">
          {reviews.map((review) => (
            <article className="card padded" key={review._id}>
              <strong>{ratingLabel(review.rating)}</strong>
              {review.comment && <p>{review.comment}</p>}
              <small>{review.customer?.name || "Customer"}</small>
            </article>
          ))}
          {!reviews.length && (
            <div className="card padded">No market reviews yet.</div>
          )}
        </div>
      </section>
    </div>
  );
}
