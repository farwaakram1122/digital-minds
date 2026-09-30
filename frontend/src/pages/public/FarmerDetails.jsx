import { CalendarDays, Heart, MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import FarmerCard from "../../components/FarmerCard";
import MarketCard from "../../components/MarketCard";
import ProductCard from "../../components/ProductCard";
import MapEmbed from "../../components/common/MapEmbed";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { ratingLabel } from "../../../../JS/reviewRatings.js";
import { farmers, markets, products } from "../../data/platformData";
import { imageProps } from "../../../../JS/images.js";

export default function FarmerDetails() {
  const { id } = useParams();
  const { favorites, toggleFavorite, catalogVersion } = useApp();
  const [reviews, setReviews] = useState([]);

  const farmer = farmers.find((item) => item.id === id);
  useEffect(() => {
    if (farmer?._id)
      api(`/reviews?farmer=${farmer._id}`)
        .then(setReviews)
        .catch(console.error);
  }, [farmer?._id, catalogVersion]);

  if (!farmer) {
    return (
      <div className="page container">
        <div className="empty card">
          <h1>Farmer not found</h1>
          <p>The farmer profile you requested is not available.</p>
        </div>
      </div>
    );
  }

  const farmerProducts = products.filter(
    (product) => product.farmerId === farmer.id,
  );

  const farmerMarkets = markets.filter((market) =>
    farmer.markets.includes(market.id),
  );

  const isFavorite = favorites.farmers.includes(farmer.id);

  return (
    <div className="page container">
      <div className="profile-hero card">
        <img {...imageProps(farmer.image, farmer.business, 'farmer')} alt={farmer.business} />

        <div className="profile-hero-copy">
          <div className="eyebrow">LOCAL FARMER PROFILE</div>
          <h1>{farmer.business}</h1>
          <p>{farmer.about}</p>

          <div className="profile-meta">
            <span className="profile-source">Approved MarketLink stall</span>
            <span>
              <MapPin size={16} />
              {farmer.location}
            </span>
            <span>
              <CalendarDays size={16} />
              {farmer.days.join(" & ")}
            </span>
          </div>
        </div>

        <button
          className={`btn btn-ghost ${isFavorite ? "active-outline" : ""}`}
          onClick={() => toggleFavorite("farmers", farmer.id)}
        >
          <Heart size={17} />
          {isFavorite ? "Saved" : "Save farmer"}
        </button>
      </div>

      <section className="section inner">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Weekly stock</span>
            <h2>Available this week</h2>
          </div>
          <span className="soft-count">{farmerProducts.length}</span>
        </div>

        <div className="product-grid compact">
          {farmerProducts.map((product) => (
            <ProductCard product={product} key={product.id} />
          ))}
        </div>
      </section>

      <section className="section inner">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Pickup</span>
            <h2>Markets this farmer attends</h2>
          </div>
        </div>

        <div className="market-grid">
          {farmerMarkets.map((market) => (
            <MarketCard market={market} key={market.id} />
          ))}
        </div>
      </section>

      <section className="card padded producer-source-card">
        <span className="section-kicker">Stall location</span>
        <h2>Find this producer</h2>
        <p>{farmer.location}</p>
        {Number.isFinite(farmer.lat) && Number.isFinite(farmer.lng) && (
          <>
            <MapEmbed lat={farmer.lat} lng={farmer.lng} title={`${farmer.business} stall`} />
            <a className="text-link" href={`https://www.openstreetmap.org/directions?to=${farmer.lat}%2C${farmer.lng}`} target="_blank" rel="noopener noreferrer">Directions to stall ↗</a>
          </>
        )}
      </section>
      <section className="card padded producer-source-card">
        <span className="section-kicker">Customer feedback</span>
        <h2>Farmer reviews</h2>
        {reviews.length ? (
          reviews.map((review) => (
            <p key={review._id}>
              <strong>{ratingLabel(review.rating)}</strong> ·{" "}
              {review.customer?.name || "Customer"}
              {review.comment && (
                <>
                  <br />
                  {review.comment}
                </>
              )}
              {review.response && (
                <>
                  <br />
                  <strong>Farmer:</strong> {review.response}
                </>
              )}
            </p>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}
      </section>
    </div>
  );
}
