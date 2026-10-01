// Each star choice has a matching emoji; only the number is stored.
export const reviewRatings = [
  { value: 5, label: "🤩 ★★★★★ Excellent" },
  { value: 4, label: "😊 ★★★★☆ Good" },
  { value: 3, label: "😐 ★★★☆☆ Okay" },
  { value: 2, label: "😕 ★★☆☆☆ Poor" },
  { value: 1, label: "😞 ★☆☆☆☆ Bad" },
];

export const ratingLabel = (rating) =>
  reviewRatings.find((option) => option.value === Number(rating))?.label ||
  `${rating}/5`;
