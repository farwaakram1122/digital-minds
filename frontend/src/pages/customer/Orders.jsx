import { RefreshCw, Star, XCircle } from "lucide-react";
import { useState } from "react";
import { api } from "../../services/api";
import { reviewRatings } from "../../../../JS/reviewRatings.js";
import { imageProps } from "../../../../JS/images.js";

import StatusBadge from "../../components/common/StatusBadge";
import { useApp } from "../../context/AppContext";
import { farmers, markets, products } from "../../data/platformData";

export default function Orders() {
  const { orders, setOrderStatus, modifyOrder, addToCart } = useApp();

  const [reviewOrderId, setReviewOrderId] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewTarget, setReviewTarget] = useState("farmer");
  const [reviewText, setReviewText] = useState("");
  const [submittedReviews, setSubmittedReviews] = useState([]);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [orderError, setOrderError] = useState("");

  async function saveOrder(event, order) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await modifyOrder(order.id, {
        pickupDate: form.get("pickupDate"),
        pickupSlot: form.get("pickupSlot"),
        notes: form.get("notes"),
        items: order.items.map((item) => ({
          productId: item.productId,
          qty: Number(form.get(item.productId)),
        })),
      });
      setEditingOrderId(null);
      setOrderError("");
    } catch (error) {
      setOrderError(error.message);
    }
  }

  function reorder(order) {
    order.items.forEach((item) => {
      addToCart(item.productId, item.qty);
    });
  }

  function openReview(orderId) {
    setReviewOrderId(orderId);
    setRating(5);
    setReviewTarget("farmer");
    setReviewText("");
  }

  async function submitReview(event, orderId) {
    event.preventDefault();

    const order = orders.find((item) => item.id === orderId);
    const market = markets.find((item) => item.id === order?.marketId);
    const reviewedProduct = order?.items.find(item => reviewTarget === `product:${item.productId}`);
    const product = products.find(item => item.id === reviewedProduct?.productId);
    try {
      await api("/reviews", {
        method: "POST",
        body: {
          orderId,
          rating,
          comment: reviewText,
          ...(reviewTarget === "market" ? { marketId: market?._id } :
            reviewedProduct ? { productId: product?._id || reviewedProduct.productId } : {}),
        },
      });
    } catch (error) {
      alert(error.message);
      return;
    }
    setSubmittedReviews((currentReviews) => [...currentReviews, orderId]);

    setReviewOrderId(null);
    setReviewText("");
    setRating(5);
  }

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">ORDERS</div>
          <h1>My reservations</h1>
          <p>Monitor every pre-order from placed through collection.</p>
        </div>
      </div>

      <div className="order-cards">
        {orders.map((order) => {
          const farmer = farmers.find((item) => item.id === order.farmerId);

          const market = markets.find((item) => item.id === order.marketId);

          const canCancel = ["placed", "accepted"].includes(order.status);

          const reviewSubmitted = submittedReviews.includes(order.id);

          return (
            <article className="card padded order-card" key={order.id}>
              <div className="row-between top">
                <div>
                  <span className="muted small">Order {order.id}</span>
                  <h3>{farmer?.business}</h3>
                </div>

                <StatusBadge status={order.status} />
              </div>

              <div className="order-items">
                {order.items.map((item) => {
                  const product = products.find(
                    (entry) => entry.id === item.productId,
                  );

                  return (
                    <span key={item.productId} className="order-product-line">
                      <img {...imageProps(item.image, item.name)} alt={item.name} />
                      {item.qty} {item.unit} × {product?.name || item.name}
                    </span>
                  );
                })}
              </div>
              <div className="order-stage-list">
                {[
                  "placed",
                  "accepted",
                  "packing",
                  "packed",
                  "ready",
                  "completed",
                ].map((stage, index, steps) => (
                  <span
                    className={
                      steps.indexOf(
                        order.status === "out_for_delivery"
                          ? "packed"
                          : order.status,
                      ) >= index
                        ? "done"
                        : ""
                    }
                    key={stage}
                  >
                    {stage === "ready" ? "ready for pickup" : stage}
                  </span>
                ))}
              </div>

              <div className="order-meta">
                <span>
                  <small>Market</small>
                  {market?.name}
                </span>
                <span>
                  <small>Pickup</small>
                  {order.pickupDate}, {order.pickupSlot}
                </span>
                <span>
                  <small>Value</small>
                  Rs {order.total.toLocaleString()}
                </span>
              </div>

              <div className="order-actions">
                {order.status === "placed" && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => {
                      setEditingOrderId(order.id);
                      setOrderError("");
                    }}
                  >
                    Change pickup / quantity
                  </button>
                )}
                {canCancel && (
                  <button
                    className="btn btn-danger-outline"
                    onClick={() => setOrderStatus(order.id, "cancelled")}
                  >
                    <XCircle size={16} />
                    Cancel
                  </button>
                )}

                {order.status === "completed" && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => reorder(order)}
                  >
                    <RefreshCw size={16} />
                    Reorder
                  </button>
                )}

                {order.status === "completed" && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => openReview(order.id)}
                  >
                    <Star size={16} />
                    Rate farmer or market
                  </button>
                )}

                {reviewSubmitted && (
                  <span className="review-complete-note">Review submitted</span>
                )}
              </div>

              {editingOrderId === order.id && (
                <form
                  className="inline-review-form"
                  onSubmit={(event) => saveOrder(event, order)}
                >
                  <label>
                    Pickup date
                    <input
                      name="pickupDate"
                      type="date"
                      required
                      defaultValue={order.pickupDate}
                      min={new Date().toLocaleDateString("en-CA")}
                    />
                  </label>
                  <label>
                    Pickup slot
                    <select name="pickupSlot" defaultValue={order.pickupSlot}>
                      {(farmer?.pickupSlots?.length
                        ? farmer.pickupSlots
                        : ["09:00–09:30", "09:30–10:00", "10:00–10:30"]
                      ).map((slot) => (
                        <option key={slot}>{slot}</option>
                      ))}
                    </select>
                  </label>
                  {order.items.map((item) => (
                    <label key={item.productId}>
                      {item.name} quantity
                      <input
                        type="number"
                        min="1"
                        required
                        name={item.productId}
                        defaultValue={item.qty}
                      />
                    </label>
                  ))}
                  <label>
                    Notes
                    <textarea name="notes" defaultValue={order.notes || ""} />
                  </label>
                  {orderError && <div className="error-note">{orderError}</div>}
                  <div className="order-actions">
                    <button className="btn btn-primary">Save changes</button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => setEditingOrderId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {reviewOrderId === order.id && (
                <form
                  className="inline-review-form"
                  onSubmit={(event) => submitReview(event, order.id)}
                >
                  <div className="review-form-heading">
                    <div>
                      <span className="section-kicker">Completed order</span>
                      <strong>Rate {farmer?.business}</strong>
                    </div>

                    <select
                      value={rating}
                      onChange={(event) =>
                        setRating(Number(event.target.value))
                      }
                    >
                      {reviewRatings.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <textarea
                    rows="3"
                    value={reviewText}
                    onChange={(event) => setReviewText(event.target.value)}
                    placeholder="Write a comment if you like (optional)"
                  />
                  <label>
                    Rate
                    <select
                      value={reviewTarget}
                      onChange={(event) => setReviewTarget(event.target.value)}
                    >
                      <option value="farmer">Farmer service</option>
                      <option value="market">Market service</option>
                      {order.items.map(item => <option key={item.productId} value={`product:${item.productId}`}>{item.name}</option>)}
                    </select>
                  </label>

                  <div className="order-actions">
                    <button className="btn btn-primary">Submit review</button>
                    <button
                      className="btn btn-ghost"
                      type="button"
                      onClick={() => setReviewOrderId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
