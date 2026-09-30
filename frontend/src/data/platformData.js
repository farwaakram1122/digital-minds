export const categories = [
  "Fresh Produce",
  "Dairy & Eggs",
  "Baked Goods",
  "Honey & Pantry",
  "Meat & Poultry",
  "Condiments",
  "Grains & Pulses"
];

export const marketImage = "https://images.pexels.com/photos/12211158/pexels-photo-12211158.jpeg?auto=compress&cs=tinysrgb&w=1400";
export const seedMarkets = [
  {
    "id": "m1",
    "name": "Islamabad Farmers Market",
    "address": "Dino Park, next to the Old Zoo, Islamabad",
    "day": "Saturday",
    "hours": "09:00–13:00",
    "image": "https://images.pexels.com/photos/12211158/pexels-photo-12211158.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.7299,
    "lng": 73.0533
  },
  {
    "id": "m2",
    "name": "MCI Organic Community Market",
    "address": "F-7/3 Park, Islamabad",
    "day": "Saturday",
    "hours": "Community market schedule",
    "image": "https://images.pexels.com/photos/30818583/pexels-photo-30818583.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.7208,
    "lng": 73.0565
  },
  {
    "id": "m3",
    "name": "Weekly Bazaar H-9",
    "address": "H-9, Islamabad",
    "day": "Sunday, Tuesday & Friday",
    "hours": "Weekly bazaar hours",
    "image": "https://images.pexels.com/photos/11925574/pexels-photo-11925574.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.6818,
    "lng": 73.0434
  },
  {
    "id": "m4",
    "name": "Weekly Bazaar G-6",
    "address": "G-6/4, Islamabad",
    "day": "Sunday",
    "hours": "Weekly bazaar hours",
    "image": "https://images.pexels.com/photos/14564807/pexels-photo-14564807.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.7167,
    "lng": 73.0822
  },
  {
    "id": "m5",
    "name": "Weekly Bazaar G-10",
    "address": "G-10, Islamabad",
    "day": "Sunday",
    "hours": "Weekly bazaar hours",
    "image": "https://images.pexels.com/photos/11097810/pexels-photo-11097810.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.6768,
    "lng": 73.0061
  },
  {
    "id": "m6",
    "name": "Karachi Farmers Market",
    "address": "Haque Academy, 208-A Street 31, DHA Phase VIII, Karachi",
    "day": "Online catalogue / market updates",
    "hours": "Check current market updates",
    "image": "https://images.pexels.com/photos/36698092/pexels-photo-36698092.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 24.777804,
    "lng": 67.0662863
  },
  {
    "id": "m7",
    "name": "Haryali Market",
    "address": "Rosa Vista Farms, Burki Road, Lahore",
    "day": "Event-based",
    "hours": "Announced per event",
    "image": "https://images.pexels.com/photos/31930012/pexels-photo-31930012.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 31.50245,
    "lng": 74.47272
  },
  {
    "id": "m8", "name": "Hussain Agahi Market", "address": "Near Lohari Gate, Multan", "city": "Multan",
    "day": "Schedule to be confirmed", "hours": "Confirm pickup day with the market",
    "image": "https://images.pexels.com/photos/14445907/pexels-photo-14445907.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 30.1972, "lng": 71.46974
  },
  {
    "id": "m9", "name": "Raja Bazar", "address": "Raja Bazar, Rawalpindi", "city": "Rawalpindi",
    "day": "Schedule to be confirmed", "hours": "Confirm pickup day with the market",
    "image": "https://images.pexels.com/photos/12252365/pexels-photo-12252365.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.61477, "lng": 73.05549
  },
  {
    "id": "m10", "name": "Karkhano Market", "address": "Karkhano, Peshawar", "city": "Peshawar",
    "day": "Schedule to be confirmed", "hours": "Confirm pickup day with the market",
    "image": "https://images.pexels.com/photos/3873912/pexels-photo-3873912.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 33.9987, "lng": 71.42406
  },
  {
    "id": "m11", "name": "Shahi Bazar", "address": "Shahi Bazar Road, Hyderabad, Sindh", "city": "Hyderabad",
    "day": "Schedule to be confirmed", "hours": "Confirm pickup day with the market",
    "image": "https://images.pexels.com/photos/27854616/pexels-photo-27854616.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 25.38921, "lng": 68.37227
  },
  {
    "id": "m12", "name": "Fruit & Vegetables Market", "address": "Ghulam Muhammadabad Road, Faisalabad", "city": "Faisalabad",
    "day": "Schedule to be confirmed", "hours": "Confirm pickup day with the market",
    "image": "https://images.pexels.com/photos/33554281/pexels-photo-33554281.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 31.44185, "lng": 73.0428
  },
  {
    "id": "m13", "name": "Liberty Market", "address": "Noor Jahan Road, Lahore", "city": "Lahore",
    "day": "Schedule to be confirmed", "hours": "Confirm pickup day with the market",
    "image": "https://images.pexels.com/photos/36033532/pexels-photo-36033532.jpeg?auto=compress&cs=tinysrgb&w=1200",
    "lat": 31.51128, "lng": 74.34501
  }
];

export const markets = [];
export const farmers = [];
export const products = [];
// Public preview cards stay separate from farmer-owned inventory.
export const sampleProducts = [
  { id: 'sample-vegetables', name: 'Seasonal vegetable box', price: 850, unit: 'box', stock: 8, image: '' },
  { id: 'sample-eggs', name: 'Farm fresh eggs', price: 480, unit: 'dozen', stock: 8, image: 'https://images.pexels.com/photos/162712/egg-white-food-protein-162712.jpeg?auto=compress&cs=tinysrgb&w=600' },
  { id: 'sample-honey', name: 'Local honey jar', price: 1200, unit: 'jar', stock: 8, image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=600' },
];
