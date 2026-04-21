import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';
import './OrderDetailPage.css';

const STATUS_STEPS = ['Pending','Confirmed','Baking','Ready','Out for Delivery','Delivered'];
const STATUS_ICONS = { Pending:'⏳', Confirmed:'✅', Baking:'🔥', Ready:'📦', 'Out for Delivery':'🚚', Delivered:'🎉', Cancelled:'❌' };

const OrderDetailPage = () => {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getById(id)
      .then(r => setOrder(r.data.order))
      .catch(() => navigate('/orders'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!order)  return null;

  const stepIdx = STATUS_STEPS.indexOf(order.orderStatus);

  const openWA = () => {
    const msg = `Hi! I have a query about my order #${order.orderNumber}`;
    window.open(`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="order-detail-page" style={{ paddingTop: 68 }}>
      <div className="order-hero">
        <div className="container">
          <p className="section-label">Order Details</p>
          <h1 className="page-title">#{order.orderNumber}</h1>
          <p>Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}</p>
        </div>
      </div>

      <div className="container order-layout">
        <div className="order-main">

          {/* Status tracker */}
          <div className="order-card">
            <h3>Order Status: <span className={`status-chip status-${order.orderStatus.replace(/\s/g,'-')}`}>{STATUS_ICONS[order.orderStatus]} {order.orderStatus}</span></h3>
            {order.orderStatus !== 'Cancelled' && (
              <div className="status-track">
                {STATUS_STEPS.map((step, i) => (
                  <div key={step} className={`track-step ${i <= stepIdx ? 'done' : ''} ${i === stepIdx ? 'current' : ''}`}>
                    <div className="track-dot">{i <= stepIdx ? '✓' : ''}</div>
                    {i < STATUS_STEPS.length - 1 && <div className="track-line" />}
                    <p className="track-label">{STATUS_ICONS[step]} {step}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Items */}
          <div className="order-card">
            <h3>Items Ordered</h3>
            {order.orderItems.map((item, i) => (
              <div key={i} className="order-item-row">
                <div className="order-item-img">
                  {item.image ? <img src={item.image} alt={item.name} /> : <span>🎂</span>}
                </div>
                <div className="order-item-body">
                  <p className="order-item-name">{item.name}</p>
                  {item.selectedSize    && <p className="order-item-meta">Size: {item.selectedSize}</p>}
                  {item.selectedFlavour && <p className="order-item-meta">Flavour: {item.selectedFlavour}</p>}
                  {item.customMessage   && <p className="order-item-meta">🎂 Message: "{item.customMessage}"</p>}
                  <p className="order-item-meta">Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}</p>
                </div>
                <p className="order-item-total">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>

          {/* Status history */}
          <div className="order-card">
            <h3>Status History</h3>
            <div className="history-list">
              {[...order.statusHistory].reverse().map((h, i) => (
                <div key={i} className="history-item">
                  <div className="history-dot" />
                  <div>
                    <p className="history-status">{STATUS_ICONS[h.status]} {h.status}</p>
                    <p className="history-msg">{h.message}</p>
                    <p className="history-time">{new Date(h.updatedAt).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="order-card">
            <h3>Order Summary</h3>
            <div className="order-total-rows">
              <div className="otr"><span>Subtotal</span><span>₹{order.itemsPrice.toLocaleString('en-IN')}</span></div>
              <div className="otr"><span>Delivery</span><span>{order.deliveryPrice===0?'FREE':'₹'+order.deliveryPrice}</span></div>
              <div className="otr grand"><span>Total</span><span>₹{order.totalPrice.toLocaleString('en-IN')}</span></div>
            </div>
            <div className="order-info-rows">
              <div className="oir"><strong>Payment:</strong> {order.paymentMethod}</div>
              <div className="oir"><strong>Paid:</strong> {order.isPaid ? '✅ Yes' : '❌ Pending'}</div>
              {order.deliveryDate && <div className="oir"><strong>Delivery Date:</strong> {new Date(order.deliveryDate).toDateString()}</div>}
            </div>
          </div>

          <div className="order-card" style={{ marginTop: 20 }}>
            <h3>Delivery Address</h3>
            <p style={{ fontSize:14, color:'var(--brown-mid)', lineHeight:1.7 }}>
              {order.customerName}<br />
              {order.shippingAddress.street}<br />
              {order.shippingAddress.city} — {order.shippingAddress.pincode}<br />
              📱 {order.customerPhone}
            </p>
          </div>

          <div style={{ marginTop: 20, display:'flex', flexDirection:'column', gap:10 }}>
            <button className="btn-wa" style={{ width:'100%', justifyContent:'center' }} onClick={openWA}>
              📱 Need help? WhatsApp us
            </button>
            <button className="btn-outline" style={{ width:'100%', justifyContent:'center' }} onClick={() => navigate('/orders')}>
              View All Orders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
