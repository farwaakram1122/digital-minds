// Public pages and role-based dashboard routes.
import { Navigate, Route, Routes } from 'react-router-dom';

import PublicLayout from './components/layout/PublicLayout';
import DashboardShell from './components/layout/DashboardShell';
import { useApp } from './context/AppContext';

import Home from './pages/public/Home';
import Products from './pages/public/Products';
import ProductDetails from './pages/public/ProductDetails';
import Farmers from './pages/public/Farmers';
import FarmerDetails from './pages/public/FarmerDetails';
import Markets from './pages/public/Markets';
import MarketDetails from './pages/public/MarketDetails';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import FAQ from './pages/public/FAQ';
import Privacy from './pages/public/Privacy';
import Login from './pages/public/Login';
import Register from './pages/public/Register';
import NotFound from './pages/public/NotFound';

import Cart from './pages/customer/Cart';
import Checkout from './pages/customer/Checkout';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Orders from './pages/customer/Orders';
import Favorites from './pages/customer/Favorites';
import Profile from './pages/customer/Profile';
import Notifications from './pages/shared/Notifications';
import Messages from './pages/shared/Messages';

import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerProducts from './pages/farmer/FarmerProducts';
import WeeklyStock from './pages/farmer/WeeklyStock';
import FarmerOrders from './pages/farmer/FarmerOrders';
import PickupSlots from './pages/farmer/PickupSlots';
import FarmerReviews from './pages/farmer/FarmerReviews';
import FarmerAnalytics from './pages/farmer/FarmerAnalytics';
import FarmerProfile from './pages/farmer/FarmerProfile';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFarmers from './pages/admin/AdminFarmers';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminMarkets from './pages/admin/AdminMarkets';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminOrders from './pages/admin/AdminOrders';
import AdminReviews from './pages/admin/AdminReviews';
import AdminReports from './pages/admin/AdminReports';
import AdminAnnouncements from './pages/admin/AdminAnnouncements';

function RoleGuard({ role, children }) {
  const { user, authReady } = useApp();

  if (!authReady) return <p className="page container">Checking account…</p>;

  if (!user) {
    return (
      <Navigate
        to={role === 'admin' ? '/admin/login' : '/login'}
        replace
      />
    );
  }

  if (user.role !== role) {
    return (
      <Navigate
        to={`/${user.role}`}
        replace
      />
    );
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/farmers" element={<Farmers />} />
        <Route path="/farmers/:id" element={<FarmerDetails />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/markets/:id" element={<MarketDetails />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login adminMode />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
      </Route>

      <Route
        path="/customer"
        element={
          <RoleGuard role="customer">
            <DashboardShell role="customer" />
          </RoleGuard>
        }
      >
        <Route index element={<CustomerDashboard />} />
        <Route path="orders" element={<Orders />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      <Route
        path="/farmer"
        element={
          <RoleGuard role="farmer">
            <DashboardShell role="farmer" />
          </RoleGuard>
        }
      >
        <Route index element={<FarmerDashboard />} />
        <Route path="products" element={<FarmerProducts />} />
        <Route path="stock" element={<WeeklyStock />} />
        <Route path="orders" element={<FarmerOrders />} />
        <Route path="slots" element={<PickupSlots />} />
        <Route path="reviews" element={<FarmerReviews />} />
        <Route path="analytics" element={<FarmerAnalytics />} />
        <Route path="profile" element={<FarmerProfile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleGuard role="admin">
            <DashboardShell role="admin" />
          </RoleGuard>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="farmers" element={<AdminFarmers />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="markets" element={<AdminMarkets />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="announcements" element={<AdminAnnouncements />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
