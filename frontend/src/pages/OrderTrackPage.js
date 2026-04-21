import React, { useState } from 'react';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';
import './OrderTrackPage.css';

const STATUS_STEPS = ['Pending','Confirmed','Baking','Ready','Out for Delivery','Delivered'];
const STATUS_ICONS = { Pending:'⏳', Confirmed:'✅', Baking:'🔥', Ready:'📦', 'Out for Delivery':'🚚', Delivered:'🎉', Cancelled:'❌' };

const OrderTrackPage = () => {
  const [orderNum, setOrderNum] = useState('');
  const [order,    setOrder]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderNum.trim()) { toast.error('Enter your order number'); return; }
    setLoading(true);
    setOrder(null);
    try {
      const { data } = await orderAPI.track(orderNum.trim().toUpperCase());
      setOrder(data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order not found. Check your order number.');
    } finally { setLoading(false); }
  };

  const stepIdx = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1;

  return (
    <div className="track-page" style={{ paddingTop: 68 }}>
      <div className="track-hero">
        <div className="container">
          <p className="section-label">Order Tracking</p>
          <h1 className="page-title">Track Your Order</h1>
          <p>Enter your order number to see real-time status</p>
        </div>
      </div>

      <div className="container track-inner">
        <div className="track-form-card">
          <span className="track-icon">📦</span>
          <h2>Where is my order?</h2>
          <p>Your order number was sent via WhatsApp after you placed your order (e.g. <strong>SC0012</strong>)</p>
          <form onSubmit={handleTrack} className="track-form">
            <input
              className="form-control track-input"
              placeholder="Enter order number (e.g. SC0012)"
              value={orderNum}
              onChange={e => setOrderNum(e.target.value.toUpperCase())}
              maxLength={10}
            />
            <button type="submit" className="btn-primary track-btn" disabled={loading}>
              {loading ? 'Searching…' : '🔍 Track Order'}
            </button>
          </form>
        </div>

        {order && (
          <div className="track-result">
            <div className="track-result-header">
              <div>
                <p className="track-order-num">Order #{order.orderNumber}</p>
                <p className="track-customer">For: {order.customerName}</p>
                <p className="track-date">Placed: {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
              </div>
              <div className="track-amount">
                <p className="track-total">₹{order.totalPrice?.toLocaleString('en-IN')}</p>
                <p className="track-payment">{order.paymentMethod}</p>
              </div>
            </div>

            {/* Status tracker */}
            {order.orderStatus !== 'Cancelled' ? (
              <div className="track-steps">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className={`track-step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}>
                    <div className="track-dot-wrap">
                      <div className="track-dot">{i <= stepIdx ? '✓' : i + 1}</div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`track-connector ${i < stepIdx ? 'done' : ''}`} />
                      )}
                    </div>
                    <p className="track-step-icon">{STATUS_ICONS[step]}</p>
                    <p className="track-step-label">{step}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="track-cancelled">
                <span>❌</span>
                <p>This order was cancelled. Please WhatsApp us if you have questions.</p>
              </div>
            )}

            {/* Status history */}
            <div className="track-history">
              <h3>Status Updates</h3>
              {[...order.statusHistory].reverse().map((h, i) => (
                <div key={i} className="track-history-item">
                  <div className="track-history-dot" />
                  <div>
                    <p className="track-history-status">{STATUS_ICONS[h.status]} {h.status}</p>
                    {h.message && <p className="track-history-msg">{h.message}</p>}
                    <p className="track-history-time">{new Date(h.updatedAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="track-help">
              <p>Need help with this order?</p>
              <button className="btn-wa" style={{ justifyContent: 'center' }}
                onClick={() => window.open(`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hi! I have a query about my order #${order.orderNumber}`)}`, '_blank')}>
                📱 WhatsApp Us
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrackPage;
