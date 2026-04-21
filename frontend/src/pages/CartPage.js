import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, delivery, total, removeItem, updateQty, clearCart } = useCart();

  if (items.length === 0) return (
    <div className="cart-page" style={{ paddingTop: 68 }}>
      <div className="container empty-cart">
        <span className="empty-icon">🛒</span>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any treats yet!</p>
        <button className="btn-primary" onClick={() => navigate('/products')}>Browse Products</button>
      </div>
    </div>
  );

  const openWA = () => {
    const lines = items.map(i => `• ${i.name}${i.selectedSize ? ` (${i.selectedSize})` : ''} x${i.qty} — ₹${(i.price * i.qty).toLocaleString('en-IN')}`).join('\n');
    const msg = `🍰 SweetCrumbs Order\n\n${lines}\n\nTotal: ₹${total.toLocaleString('en-IN')}\nDelivery: ${delivery === 0 ? 'FREE' : '₹' + delivery}`;
    window.open(`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="cart-page" style={{ paddingTop: 68 }}>
      <div className="cart-hero">
        <div className="container">
          <p className="section-label">Shopping Cart</p>
          <h1 className="page-title">Your Cart</h1>
          <p>{items.reduce((s,i) => s + i.qty, 0)} item(s) selected</p>
        </div>
      </div>

      <div className="container cart-layout">
        {/* Items */}
        <div className="cart-items">
          <div className="cart-items-header">
            <h3>Cart Items</h3>
            <button className="clear-btn" onClick={clearCart}>Clear All</button>
          </div>
          {items.map(item => (
            <div key={item.cartKey} className="cart-item">
              <div className="cart-img">
                {item.image
                  ? <img src={item.image} alt={item.name} />
                  : <span style={{ fontSize: 36 }}>🎂</span>
                }
              </div>
              <div className="cart-item-body">
                <p className="cart-item-name">{item.name}</p>
                {item.selectedSize    && <p className="cart-item-meta">Size: {item.selectedSize}</p>}
                {item.selectedFlavour && <p className="cart-item-meta">Flavour: {item.selectedFlavour}</p>}
                {item.customMessage   && <p className="cart-item-meta">🎂 "{item.customMessage}"</p>}
                <p className="cart-item-unit">₹{item.price.toLocaleString('en-IN')} each</p>
                <div className="cart-qty-row">
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => updateQty(item.cartKey, item.qty - 1)}>−</button>
                    <span className="qty-num">{item.qty}</span>
                    <button className="qty-btn" onClick={() => updateQty(item.cartKey, item.qty + 1)}>+</button>
                  </div>
                  <button className="remove-btn" onClick={() => removeItem(item.cartKey)}>🗑️ Remove</button>
                </div>
              </div>
              <div className="cart-item-price">
                ₹{(item.price * item.qty).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="cart-summary">
          <h3>Order Summary</h3>
          <div className="summary-rows">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <span className={delivery === 0 ? 'free-delivery' : ''}>
                {delivery === 0 ? 'FREE 🎉' : `₹${delivery}`}
              </span>
            </div>
            {delivery > 0 && (
              <p className="free-hint">
                Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free delivery
              </p>
            )}
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button className="btn-primary summary-btn" onClick={() => navigate('/checkout')}>
            Proceed to Checkout →
          </button>
          <button className="btn-wa summary-btn" onClick={openWA}>
            📱 Order via WhatsApp
          </button>
          <button className="btn-outline summary-btn" onClick={() => navigate('/products')}>
            Continue Shopping
          </button>

          <div className="trust-badges">
            <div className="trust-item">🔒 Secure Checkout</div>
            <div className="trust-item">🚚 Fast Delivery</div>
            <div className="trust-item">🍰 Freshly Baked</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
