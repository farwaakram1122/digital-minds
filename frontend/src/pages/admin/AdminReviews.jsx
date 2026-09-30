import ResourcePage from "../../components/admin/ResourcePage";
import { ratingLabel } from "../../../../JS/reviewRatings.js";
export default function AdminReviews() {
  return (
    <ResourcePage
      title="Reviews"
      endpoint="/admin/reviews"
      readOnly
      columns={[
        { key: "customerName", label: "Customer" },
        { key: "farmerName", label: "Farmer" },
        { key: "target", label: "Review of" },
        { key: "rating", label: "Rating", render: ratingLabel },
        { key: "comment", label: "Optional comment" },
        { key: "response", label: "Farmer response" },
      ]}
    />
  );
}
