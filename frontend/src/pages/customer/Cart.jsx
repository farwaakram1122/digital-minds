import {
  ArrowRight,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { useApp } from '../../context/AppContext';
import { imageProps } from '../../../../JS/images.js';
import {
  farmers,
  products,
  sampleProducts,
} from '../../data/platformData';

export default function Cart() {
  const {
    cart,
    user,
    updateCart,
    removeFromCart,
  } = useApp();

  const cartRows = cart.map((cartItem) => ({
    ...cartItem,
    product: [...products, ...sampleProducts].find(
      (product) => product.id === cartItem.productId
    ),
  })).filter(item => item.product);

  const totalValue = cartRows.reduce(
    (sum, cartItem) =>
      sum + cartItem.product.price * cartItem.qty,
    0
  );

  const totalItems = cartRows.reduce(
    (sum, cartItem) => sum + cartItem.qty,
    0
  );
  const hasSamples = cartRows.some(item => item.productId.startsWith('sample-'));

  return (
    <div className="page container">
      <div className="page-intro">
        <div className="eyebrow">RESERVATION CART</div>
        <h1>Your weekly pickup</h1>
        <p>
          Products are reserved by farmer and paid for at collection.
        </p>
      </div>

      {cartRows.length > 0 ? (
        <div className="cart-layout">
          <div className="cart-list">
            {cartRows.map((cartItem) => {
              const farmer = farmers.find(
                (item) =>
                  item.id === cartItem.product.farmerId
              );

              return (
                <div
                  className="cart-item card"
                  key={cartItem.productId}
                >
                  <img
                    {...imageProps(cartItem.product.image, cartItem.product.name, 'product', cartItem.product.category)}
                    alt={cartItem.product.name}
                  />

                  <div className="grow">
                    <Link className="card-title" to={hasSamples && cartItem.productId.startsWith('sample-') ? '/products' : `/products/${cartItem.product.id}`}>
                      {cartItem.product.name}
                    </Link>

                    <span className="muted small">
                      {farmer?.business || 'Sample preview'}
                    </span>

                    <strong>
                      Rs {cartItem.product.price.toLocaleString()} /{' '}
                      {cartItem.product.unit}
                    </strong>
                  </div>

                  <div className="qty">
                    <button
                      type="button"
                      onClick={() =>
                        updateCart(
                          cartItem.productId,
                          cartItem.qty - 1
                        )
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus size={15} />
                    </button>

                    <span>{cartItem.qty}</span>

                    <button
                      type="button"
                      onClick={() =>
                        updateCart(
                          cartItem.productId,
                          Math.min(
                            cartItem.product.stock,
                            cartItem.qty + 1
                          )
                        )
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus size={15} />
                    </button>
                  </div>

                  <strong className="cart-line-total">
                    Rs {(
                      cartItem.product.price * cartItem.qty
                    ).toLocaleString()}
                  </strong>

                  <button
                    className="icon-btn"
                    type="button"
                    onClick={() =>
                      removeFromCart(cartItem.productId)
                    }
                    aria-label="Remove product"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            })}
          </div>

          <aside className="summary card padded sticky-summary">
            <span className="section-kicker">Reservation</span>
            <h2>Order summary</h2>

            <p>
              <span>Items</span>
              <strong>{totalItems}</strong>
            </p>
            <p>
              <span>Reservation value</span>
              <strong>Rs {totalValue.toLocaleString()}</strong>
            </p>

            <hr />

            <div className="pay-note">
              Payment method
              <strong>Pay at pickup</strong>
            </div>

            {hasSamples && <p className="warning-note">Sample cards demonstrate the cart. Only products added by approved farmers can be reserved.</p>}
            <Link
              className="btn btn-primary full"
              to={!user ? '/panels/login.html' : hasSamples ? '/products' : '/checkout'}
            >
              {!user ? 'Continue · sign in or register' : hasSamples ? 'Browse live farmer stock' : 'Continue to pickup'}
              <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
      ) : (
        <div className="empty card">
          <h2>Your cart is empty</h2>
          <p>
            Browse current weekly stock and reserve what you need.
          </p>
          <Link
            to="/products"
            className="btn btn-primary"
          >
            Browse products
          </Link>
        </div>
      )}
    </div>
  );
}
