import {
  ArrowLeft,
  Heart,
  MapPin,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ProductCard from "../../components/ProductCard";
import MapEmbed from "../../components/common/MapEmbed";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { ratingLabel } from "../../../../JS/reviewRatings.js";
import { farmers, markets, products } from "../../data/platformData";
import { imageProps } from "../../../../JS/images.js";

export default function ProductDetails() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);

  const { addToCart, favorites, toggleFavorite, catalogVersion } = useApp();

  const product = products.find((item) => item.id === id);
  useEffect(() => {
    if (product?._id)
      api(`/reviews?product=${product._id}`)
        .then(setReviews)
        .catch(console.error);
  }, [product?._id, catalogVersion]);

  if (!product) {
    return (
      <div className="page container">
        <div className="empty card">
          <h1>Product not found</h1>
          <p>The product you requested is not currently available.</p>
        </div>
      </div>
    );
  }

  const farmer = farmers.find((item) => item.id === product.farmerId);

  const primaryMarket = markets.find((market) =>
    product.marketIds.includes(market.id),
  );

  const isFavorite = favorites.products.includes(product.id);

  const relatedProducts = products
    .filter(
      (item) => item.category === product.category && item.id !== product.id,
    )
    .slice(0, 4);

  function decreaseQuantity() {
    setQuantity((currentQuantity) => Math.max(1, currentQuantity - 1));
  }

  function increaseQuantity() {
    setQuantity((currentQuantity) =>
      Math.min(product.stock, currentQuantity + 1),
    );
  }

  return (
    <div className="page container">
      <Link to="/products" className="back-link">
        <ArrowLeft size={16} />
        Back to products
      </Link>

      <div className="product-detail">
        <div className="detail-media-panel">
          <img
            className="detail-image"
            {...imageProps(product.image, product.name, 'product', product.category)}
            alt={product.name}
          />
          <span className="detail-stock-pill">
            {product.stock === 0
              ? "Sold out"
              : product.stock <= 5
                ? `Low stock · ${product.stock} ${product.unit} left`
                : "Available for weekly pre-order"}
          </span>
        </div>

        <div className="detail-copy">
          <div className="eyebrow">{product.category}</div>
          <h1>{product.name}</h1>

          <div className="public-source-badge">
            <ShieldCheck size={16} />
            <span>Active MarketLink listing</span>
          </div>

          <p className="lead">{product.description}</p>

          <Link className="farmer-mini" to={`/farmers/${farmer.id}`}>
            <img {...imageProps(farmer.image, farmer.business, 'farmer')} alt={farmer.business} />
            <span>
              <small>Grown / made by</small>
              <strong>{farmer.business}</strong>
            </span>
          </Link>

          <div className="price-line">
            <strong>Rs {product.price.toLocaleString()}</strong>
            <span>/ {product.unit}</span>
          </div>

          <div className="qty-row">
            <div className="qty">
              <button
                type="button"
                onClick={decreaseQuantity}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span>{quantity}</span>
              <button
                type="button"
                onClick={increaseQuantity}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className="btn btn-primary grow"
              disabled={product.stock === 0}
              onClick={() => addToCart(product.id, quantity)}
            >
              Add to cart
            </button>

            <button
              className={`icon-btn big-btn ${isFavorite ? "active" : ""}`}
              onClick={() => toggleFavorite("products", product.id)}
              aria-label="Save product"
            >
              <Heart fill={isFavorite ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="detail-notes">
            <span>
              <ShieldCheck size={17} />
              Reserved against weekly stock
            </span>
            <span>
              <MapPin size={17} />
              Pay at pickup
            </span>
          </div>
        </div>
      </div>

      <div className="detail-sections">
        <section className="card padded">
          <span className="section-kicker">Collection</span>
          <h2>Pickup information</h2>
          <p>
            {primaryMarket ? (
              <>
                Available from <strong>{primaryMarket.name}</strong> on{" "}
                <strong>{primaryMarket.day}</strong>, {primaryMarket.hours}.
              </>
            ) : (
              "The farmer is updating this pickup market."
            )}
          </p>

          {primaryMarket && (
            <MapEmbed
              lat={primaryMarket.lat}
              lng={primaryMarket.lng}
              title={primaryMarket.name}
            />
          )}
        </section>

        <section className="card padded">
          <span className="section-kicker">Listing details</span>
          <h2>Product information</h2>

          <div className="listing-facts">
            <div>
              <span>Vendor</span>
              <strong>{farmer.business}</strong>
            </div>
            <div>
              <span>Market</span>
              <strong>{primaryMarket?.name || "To be updated"}</strong>
            </div>
            <div>
              <span>Published price</span>
              <strong>
                Rs {product.price.toLocaleString()} / {product.unit}
              </strong>
            </div>
            <div>
              <span>Available stock</span>
              <strong>
                {product.stock} {product.unit}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <section className="card padded related">
        <span className="section-kicker">Customer feedback</span>
        <h2>Product reviews</h2>
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
            </p>
          ))
        ) : (
          <p>No reviews yet.</p>
        )}
      </section>

      {relatedProducts.length > 0 && (
        <section className="related">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">More to browse</span>
              <h2>You may also like</h2>
            </div>
          </div>

          <div className="product-grid compact">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
