import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart }    from '../context/CartContext';
import { useAuth }   from '../context/AuthContext';
import { orderAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

const MIN_ORDER = 200;

const CheckoutPage = () => {
  const navigate  = useNavigate();
  const { items, subtotal, delivery, total, clearCart } = useCart();
  const { user }  = useAuth();

  const [form, setForm] = useState({
    street:   user?.address?.street  || '',
    city:     user?.address?.city    || 'Nagpur',
    pincode:  user?.address?.pincode || '',
    paymentMethod: 'COD',
    deliveryDate:  '',
    deliverySlot:  'Morning (9 AM – 1 PM)',
    specialInstructions: '',
  });

  // Phone number — must be confirmed/editable
  const [phone, setPhone]           = useState(user?.phone || '');
  const [phoneConfirmed, setPhoneConfirmed] = useState(!!user?.phone);
  const [waConfirmed, setWaConfirmed]       = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [orderPlaced, setOrderPlaced]       = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login?next=/checkout', { replace: true }); }
  }, [user, navigate]);

  useEffect(() => {
    if (!items.length && !orderPlaced) { navigate('/cart', { replace: true }); }
  }, [items, orderPlaced, navigate]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const today = new Date().toISOString().split('T')[0];

  const validateForm = () => {
    if (subtotal < MIN_ORDER) { toast.error(`Minimum order is ₹${MIN_ORDER}`); return false; }
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) { toast.error('Enter a valid 10-digit mobile number'); return false; }
    if (!phoneConfirmed) { toast.error('Please confirm your phone number'); return false; }
    if (!form.street.trim()) { toast.error('Delivery address is required'); return false; }
    if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) { toast.error('Enter a valid 6-digit PIN code'); return false; }
    if (!waConfirmed) { toast.error('Please confirm your order via WhatsApp first'); return false; }
    return true;
  };

  const sendToWhatsApp = () => {
    const lines = items.map(i => {
      let l = `• ${i.name}`;
      if (i.selectedSize)    l += ` [${i.selectedSize}]`;
      if (i.selectedFlavour) l += ` (${i.selectedFlavour})`;
      if (i.customMessage)   l += `\n  🎂 "${i.customMessage}"`;
      l += ` × ${i.qty} = ₹${(i.price * i.qty).toLocaleString('en-IN')}`;
      return l;
    }).join('\n');

    const msg =
      `🍰 *SweetCrumbs Order Enquiry*\n\n` +
      `👤 ${user.name}\n📱 +91 ${phone}\n\n` +
      `🛒 *Items:*\n${lines}\n\n` +
      `💰 Subtotal: ₹${subtotal.toLocaleString('en-IN')}\n` +
      `🚚 Delivery: ${delivery === 0 ? 'FREE' : '₹' + delivery}\n` +
      `💵 *Total: ₹${total.toLocaleString('en-IN')}*\n` +
      `💳 Payment: ${form.paymentMethod}\n\n` +
      `📅 Date: ${form.deliveryDate || 'ASAP'} | ${form.deliverySlot}\n` +
      `📍 ${form.street}, ${form.city} — ${form.pincode}\n` +
      (form.specialInstructions ? `📝 ${form.specialInstructions}` : '');

    window.open(`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    setWaConfirmed(true);
    toast.success('WhatsApp opened! After chatting with us, click "Place Order" below.');
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const payload = {
        orderItems: items.map(i => ({
          product:         i.product || i._id,
          qty:             i.qty,
          selectedSize:    i.selectedSize,
          selectedFlavour: i.selectedFlavour,
          customMessage:   i.customMessage,
        })),
        shippingAddress: {
          street:  form.street.trim(),
          city:    form.city.trim(),
          pincode: form.pincode.trim(),
        },
        paymentMethod:       form.paymentMethod,
        deliveryDate:        form.deliveryDate || undefined,
        deliverySlot:        form.deliverySlot,
        specialInstructions: form.specialInstructions,
      };

      const { data } = await orderAPI.create(payload);
      const order = data.order;

      if (form.paymentMethod === 'Razorpay') {
        if (!window.Razorpay) { toast.error('Payment gateway not loaded. Try refreshing.'); setSubmitting(false); return; }
        const { data: rzp } = await paymentAPI.createRazorpayOrder({ orderId: order._id });
        const options = {
          key:         rzp.keyId,
          amount:      rzp.amount,
          currency:    rzp.currency,
          name:        'SweetCrumbs',
          description: `Order #${order.orderNumber}`,
          order_id:    rzp.razorpayOrderId,
          handler: async (response) => {
            try {
              await paymentAPI.verifyPayment({
                razorpayOrderId:   response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                orderId: order._id,
              });
              clearCart();
              setOrderPlaced(order);
              toast.success('Payment successful! Order confirmed 🎉');
              navigate(`/orders/${order._id}`);
            } catch {
              toast.error('Payment verification failed. Contact us on WhatsApp.');
            }
          },
          modal: {
            ondismiss: () => {
              toast('Payment cancelled. Your order is saved — complete payment via WhatsApp.', { icon: 'ℹ️' });
            },
          },
          prefill: { name: user.name, email: user.email, contact: `+91${phone}` },
          theme: { color: '#3D1E0F' },
        };
        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
        setSubmitting(false);
        return;
      }

      clearCart();
      setOrderPlaced(order);
      toast.success('Order placed successfully! 🎂');
      navigate(`/orders/${order._id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to place order. Please try again.';
      toast.error(msg);
      if (err.response?.data?.requiresAuth) navigate('/login?next=/checkout');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || (!items.length && !orderPlaced)) return null;

  return (
    <div className="checkout-page" style={{ paddingTop: 68 }}>
      <div className="checkout-hero">
        <div className="container">
          <p className="section-label">Checkout</p>
          <h1 className="page-title">Place Your Order</h1>
          <p>Logged in as <strong>{user.name}</strong> · {user.email}</p>
        </div>
      </div>

      <div className="container checkout-layout">
        <form onSubmit={placeOrder} noValidate>

          {/* Phone confirmation */}
          <div className="form-card">
            <h3>📱 Confirm Your WhatsApp Number</h3>
            <p className="section-note">We send order updates and confirmations via WhatsApp. This number must be correct.</p>
            <div className="phone-confirm-row">
              <div className="phone-input-wrap" style={{ flex:1 }}>
                <span className="phone-prefix">+91</span>
                <input
                  className="form-control phone-input"
                  type="tel"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={e => {
                    setPhone(e.target.value.replace(/\D/g,'').slice(0,10));
                    setPhoneConfirmed(false);
                    setWaConfirmed(false);
                  }}
                  maxLength={10}
                />
              </div>
              <button type="button"
                className={`confirm-phone-btn ${phoneConfirmed ? 'confirmed' : ''}`}
                onClick={() => {
                  if (!/^[6-9]\d{9}$/.test(phone)) { toast.error('Enter a valid 10-digit number'); return; }
                  setPhoneConfirmed(true);
                  toast.success('Phone number confirmed ✅');
                }}>
                {phoneConfirmed ? '✅ Confirmed' : 'Confirm'}
              </button>
            </div>
          </div>

          {/* Delivery details */}
          <div className="form-card">
            <h3>📦 Delivery Details</h3>
            <div className="form-group">
              <label className="form-label">Full Delivery Address *</label>
              <input className="form-control" placeholder="Flat No, Building Name, Street, Area" value={form.street} onChange={set('street')} required maxLength={200} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City</label>
                <input className="form-control" value={form.city} onChange={set('city')} />
              </div>
              <div className="form-group">
                <label className="form-label">PIN Code *</label>
                <input className="form-control" placeholder="440001" value={form.pincode}
                  onChange={e => set('pincode')({ target: { value: e.target.value.replace(/\D/g,'').slice(0,6) } })}
                  required maxLength={6} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">🗓️ Preferred Delivery Date</label>
                <input className="form-control" type="date" value={form.deliveryDate} min={today} onChange={set('deliveryDate')} />
                <p className="field-note">Leave blank for earliest available</p>
              </div>
              <div className="form-group">
                <label className="form-label">Delivery Slot</label>
                <select className="form-control" value={form.deliverySlot} onChange={set('deliverySlot')}>
                  <option>Morning (9 AM – 1 PM)</option>
                  <option>Afternoon (1 PM – 5 PM)</option>
                  <option>Evening (5 PM – 8 PM)</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">🎂 Special Instructions / Cake Message</label>
              <textarea className="form-control" placeholder="Birthday message, design preferences, allergies, gate code, landmark…" value={form.specialInstructions} onChange={set('specialInstructions')} maxLength={500} />
              <p className="field-note">{500 - form.specialInstructions.length} characters remaining</p>
            </div>
          </div>

          {/* Payment */}
          <div className="form-card">
            <h3>💳 Payment Method</h3>
            {[
              { value: 'COD',      icon: '💵', label: 'Cash on Delivery', desc: 'Pay cash when your order arrives' },
              { value: 'UPI',      icon: '📲', label: 'UPI / GPay / PhonePe', desc: 'We\'ll share our UPI QR on WhatsApp' },
              { value: 'Razorpay', icon: '💳', label: 'Pay Online Now', desc: 'Cards, Net Banking, Wallets — instant confirm' },
              { value: 'WhatsApp', icon: '💬', label: 'Pay via WhatsApp', desc: 'We\'ll send a payment link on WhatsApp' },
            ].map(p => (
              <div key={p.value}
                className={`payment-option ${form.paymentMethod === p.value ? 'selected' : ''}`}
                onClick={() => setForm(f => ({ ...f, paymentMethod: p.value }))}>
                <div className="pay-radio">
                  {form.paymentMethod === p.value && <div className="pay-radio-dot" />}
                </div>
                <span className="pay-icon">{p.icon}</span>
                <div>
                  <p className="pay-label">{p.label}</p>
                  <p className="pay-desc">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* MANDATORY: WhatsApp confirmation step */}
          <div className={`wa-confirm-card ${waConfirmed ? 'done' : ''}`}>
            <div className="wa-confirm-header">
              <span className="wa-confirm-num">3</span>
              <div>
                <p className="wa-confirm-title">
                  {waConfirmed ? '✅ WhatsApp Confirmation Done!' : '📱 Confirm Order via WhatsApp (Required)'}
                </p>
                <p className="wa-confirm-sub">
                  {waConfirmed
                    ? 'You can now place your order below.'
                    : 'Before placing your order, send us a message on WhatsApp so we can confirm availability and delivery slot.'}
                </p>
              </div>
            </div>
            {!waConfirmed && (
              <button type="button" className="btn-wa wa-confirm-btn" onClick={sendToWhatsApp}>
                📱 Open WhatsApp & Send Order Details
              </button>
            )}
            {!waConfirmed && (
              <button type="button" className="already-btn" onClick={() => setWaConfirmed(true)}>
                Already chatted with you →
              </button>
            )}
          </div>

          <button type="submit" className="btn-primary checkout-submit" disabled={submitting || !waConfirmed}>
            {submitting
              ? 'Placing Order…'
              : !waConfirmed
                ? '🔒 Confirm via WhatsApp First'
                : `🎂 Place Order — ₹${total.toLocaleString('en-IN')}`}
          </button>

          {!waConfirmed && (
            <p style={{ textAlign:'center', fontSize:12, color:'var(--brown-light)', marginTop:10 }}>
              You must confirm via WhatsApp before placing your order
            </p>
          )}
        </form>

        {/* Order summary */}
        <div className="order-summary-box">
          <h3>🧾 Order Summary</h3>
          <div className="order-items-list">
            {items.map(item => (
              <div key={item.cartKey} className="order-summary-item">
                <div className="osi-img">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>🎂</span>}
                </div>
                <div className="osi-body">
                  <p className="osi-name">{item.name}</p>
                  {item.selectedSize    && <p className="osi-meta">Size: {item.selectedSize}</p>}
                  {item.selectedFlavour && <p className="osi-meta">Flavour: {item.selectedFlavour}</p>}
                  {item.customMessage   && <p className="osi-meta">🎂 "{item.customMessage}"</p>}
                  <p className="osi-meta">Qty: {item.qty}</p>
                </div>
                <p className="osi-price">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <div className="order-total-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            <div className="order-total-row">
              <span>Delivery</span>
              <span className={delivery===0?'free-delivery':''}>{delivery===0?'FREE 🎉':'₹'+delivery}</span>
            </div>
            {delivery > 0 && (
              <p style={{ fontSize:11, color:'var(--brown-light)', textAlign:'right', marginTop:-8, marginBottom:4 }}>
                Add ₹{(999 - subtotal).toLocaleString('en-IN')} more for free delivery
              </p>
            )}
            <div className="order-total-row grand"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>

          {/* Checklist */}
          <div className="checkout-checklist">
            <div className={`check-item ${phoneConfirmed ? 'done' : ''}`}>
              {phoneConfirmed ? '✅' : '○'} Phone number confirmed
            </div>
            <div className={`check-item ${form.street && form.pincode ? 'done' : ''}`}>
              {form.street && form.pincode ? '✅' : '○'} Delivery address filled
            </div>
            <div className={`check-item ${waConfirmed ? 'done' : ''}`}>
              {waConfirmed ? '✅' : '○'} WhatsApp confirmation sent
            </div>
          </div>

          <div className="order-trust">
            <p>🔒 Secure & Safe Checkout</p>
            <p>🚚 Delivery across Nagpur</p>
            <p>🍰 Freshly baked on order day</p>
            <p>📱 Order updates on WhatsApp</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
