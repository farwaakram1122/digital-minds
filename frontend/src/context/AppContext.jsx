// Shared session, catalogue, cart and notification state.
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { products, farmers, markets, categories, seedMarkets, marketImage, sampleProducts } from '../data/platformData';
import { imageSource } from '../../../JS/images.js';
import { api } from '../services/api';

const AppContext = createContext(null);

function readLocalStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  const [catalogVersion, setCatalogVersion] = useState(0);
  const [cart, setCart] = useState(() =>
    readLocalStorage('ml_cart', [])
  );

  const [favorites, setFavorites] = useState(() =>
    readLocalStorage('ml_favorites', {
      products: [],
      farmers: [],
      markets: [],
    })
  );

  const [orders, setOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    // Keep published updates visible on the home page and both dashboards.
    const refresh = () => api('/announcements').then(setAnnouncements).catch(console.error);
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('ml_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ml_favorites', JSON.stringify(favorites));
  }, [favorites]);

  async function refreshCatalog() {
    try {
      const [remoteProducts, remoteFarmers, remoteMarkets, remoteCategories] = await Promise.all([api('/products'), api('/farmers'), api('/markets'), api('/categories')]);
      const marketNames = new Map(remoteMarkets.map(m => [String(m._id), m.legacyId || String(m._id)]));
      const previousMarkets = new Map(markets.map(m => [m.id,m]));
      const previousFarmers = new Map(farmers.map(f => [f.id,f]));
      const previousProducts = new Map(products.map(p => [p.id,p]));
      markets.splice(0, markets.length, ...remoteMarkets.map(m => ({ ...previousMarkets.get(m.legacyId), id:m.legacyId||String(m._id), _id:m._id, name:m.name,address:m.address,city:m.city,day:m.days?.join(', ')||'Schedule to be confirmed',days:m.days||[],hours:m.hours,lat:m.latitude,lng:m.longitude,image:m.image||seedMarkets.find(seed=>seed.id===m.legacyId)?.image||marketImage,source:'MarketLink',categories:[...new Set(remoteProducts.filter(p=>(p.markets||[]).map(String).includes(String(m._id))).map(p=>p.category).filter(Boolean))],farmers:remoteFarmers.filter(f=>(f.markets||[]).map(String).includes(String(m._id))).length })));
      farmers.splice(0, farmers.length, ...remoteFarmers.map(f => ({ ...previousFarmers.get(f.legacyId),id:f.legacyId||f.id,_id:f.id,business:f.business,name:f.name,location:f.address,lat:f.latitude,lng:f.longitude,markets:(f.markets||[]).map(x=>marketNames.get(String(x))||String(x)),days:f.operatingDays||[],pickupSlots:f.pickupSlots||[],categories:[...new Set([f.category,...remoteProducts.filter(p=>String(p.farmer)===f.id).map(p=>p.category)].filter(Boolean))],image:imageSource(f.image, f.business || f.name, 'farmer'),about:`${f.business} at your local market.` })));
      products.splice(0, products.length, ...remoteProducts.map(p => ({ ...previousProducts.get(p.legacyId),id:p.legacyId||String(p._id),_id:p._id,name:p.name,category:p.category,price:p.price,stock:p.stock,unit:p.unit,farmerId:remoteFarmers.find(f=>f.id===String(p.farmer))?.legacyId||String(p.farmer),marketIds:(p.markets||[]).map(x=>marketNames.get(String(x))||String(x)),image:imageSource(p.image, p.name, 'product', p.category),description:p.description })));
      categories.splice(0, categories.length, ...remoteCategories.map(category => category.name));
      setCart(current => current.filter(item => [...products, ...sampleProducts].some(product => product.id === item.productId)));
      setCatalogVersion(v=>v+1);
    } catch (err) { console.error('Catalog unavailable', err); }
  }
  useEffect(() => {
    refreshCatalog();
    window.addEventListener('focus', refreshCatalog);
    return () => window.removeEventListener('focus', refreshCatalog);
  }, []);

  useEffect(() => {
    api('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setAuthReady(true));
  }, []);

  function mapFavorites(raw) {
    return Object.fromEntries(['products','farmers','markets'].map(type => [type, (raw?.[type]||[]).map(value => { const catalog={ products, farmers, markets }[type]; return catalog.find(item => item._id === String(value))?.id || String(value); })]));
  }

  useEffect(() => {
    if (!user) { setOrders([]); setNotifications([]); return; }
    const refresh = () => {
      if (document.hidden) return;
      api('/orders').then(setOrders).catch(console.error);
      api('/notifications').then(setNotifications).catch(console.error);
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    window.addEventListener('focus', refresh);
    if (user.role === 'customer') api('/favorites').then(raw => setFavorites(mapFavorites(raw))).catch(console.error);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [user]);

  async function login(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: { email, password, area: 'public' } });
    sessionStorage.setItem('ml_token', result.token);
    setUser(result.user);
    return result.user;
  }

  function logout() {
    api('/auth/logout', { method: 'POST' }).catch(console.error);
    sessionStorage.removeItem('ml_token');
    setUser(null);
    setCart([]);
  }

  function addToCart(productId, quantity = 1) {
    const product = [...products, ...sampleProducts].find(
      (item) => item.id === productId
    );

    if (!product || product.stock <= 0) {
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.productId === productId
      );

      if (existingItem) {
        return currentCart.map((item) => {
          if (item.productId !== productId) {
            return item;
          }

          return {
            ...item,
            qty: Math.min(
              item.qty + quantity,
              product.stock
            ),
          };
        });
      }

      return [
        ...currentCart,
        {
          productId,
          qty: Math.min(quantity, product.stock),
        },
      ];
    });
  }

  function updateCart(productId, quantity) {
    setCart((currentCart) => {
      if (quantity <= 0) {
        return currentCart.filter(
          (item) => item.productId !== productId
        );
      }

      return currentCart.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            qty: quantity,
          };
        }

        return item;
      });
    });
  }

  function removeFromCart(productId) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.productId !== productId
      )
    );
  }

  async function toggleFavorite(type, itemId) {
    const item = ({ products, farmers, markets })[type].find(entry => entry.id === itemId);
    const target = item?._id || itemId;
    const result = await api(`/favorites/${type}/${target}`, { method: 'POST' });
    setFavorites(mapFavorites(result));
  }

  async function placeOrder({ marketId, pickupDate, pickupSlot, notes }) {
    const created = await api('/orders', { method: 'POST', body: { marketId, pickupDate, pickupSlot, notes, items: cart.map(({ productId, qty }) => ({ productId, qty })) } });
    setOrders(current => [...created, ...current]);
    setCart([]);
    await refreshCatalog();
    return created;
  }

  async function setOrderStatus(orderId, status) {
    const updated = await api(`/orders/${orderId}/status`, { method: 'PATCH', body: { status } });
    setOrders(current => current.map(order => (order.id === orderId ? updated : order)));
    await refreshCatalog();
    return updated;
  }

  async function modifyOrder(orderId, changes) {
    const updated = await api(`/orders/${orderId}`, { method: 'PATCH', body: changes });
    setOrders(current => current.map(order => order.id === orderId ? updated : order));
    await refreshCatalog();
    return updated;
  }

  const contextValue = useMemo(
    () => ({
      user,
      authReady,
      updateUser: setUser,
      catalogVersion,
      refreshCatalog,
      login,
      logout,
      cart,
      addToCart,
      updateCart,
      removeFromCart,
      favorites,
      toggleFavorite,
      orders,
      placeOrder,
      setOrderStatus,
      modifyOrder,
      notifications,
      setNotifications,
      announcements,
    }),
    [
      user,
      authReady,
      catalogVersion,
      cart,
      favorites,
      orders,
      notifications,
      announcements,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
