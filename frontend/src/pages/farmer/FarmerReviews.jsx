import { useEffect, useState } from "react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { ratingLabel } from "../../../../JS/reviewRatings.js";

export default function FarmerReviews() {
  const { user } = useApp();
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");
  const refresh = () =>
    api(`/reviews?farmer=${user.id}`)
      .then(setReviews)
      .catch((err) => setError(err.message));
  useEffect(() => {
    refresh();
  }, [user.id]);

  async function respond(event, reviewId) {
    event.preventDefault();
    const response = new FormData(event.currentTarget).get("response");
    try {
      await api(`/farmer/reviews/${reviewId}/respond`, {
        method: "PATCH",
        body: { response },
      });
      setError("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <div className="dash-heading">
        <div>
          <div className="eyebrow">FEEDBACK</div>
          <h1>Reviews</h1>
          <p>Read customer feedback and respond where useful.</p>
        </div>
      </div>
      {error && <div className="error-note">{error}</div>}
      <div className="review-list">
        {reviews.length ? (
          reviews.map((review) => (
            <div
              className="card padded review-management-card"
              key={review._id}
            >
              <div className="row-between top">
                <div>
                  <span className="section-kicker">
                    {review.market?.name ||
                      review.product?.name ||
                      "Farmer service"}
                  </span>
                  <strong>{review.customer?.name || "Customer"}</strong>
                </div>
                <span className="rating">{ratingLabel(review.rating)}</span>
              </div>
              {review.comment && <p>{review.comment}</p>}
              {review.response ? (
                <p>
                  <strong>Your response:</strong> {review.response}
                </p>
              ) : (
                <form onSubmit={(event) => respond(event, review._id)}>
                  <label>
                    Optional response
                    <textarea
                      name="response"
                      rows="3"
                      required
                      placeholder="Write a helpful response..."
                    />
                  </label>
                  <button className="btn btn-ghost">Post response</button>
                </form>
              )}
            </div>
          ))
        ) : (
          <div className="empty card">No reviews yet.</div>
        )}
      </div>
    </>
  );
}
