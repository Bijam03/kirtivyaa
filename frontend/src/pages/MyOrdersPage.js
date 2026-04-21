// ─── MyOrdersPage ────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI } from '../services/api';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(r => setOrders(r.data.orders))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusColors = { Pending:'#e65100', Confirmed:'#2e7d32', Baking:'#f57f17', Ready:'#1565c0', 'Out for Delivery':'#7b1fa2', Delivered:'#1b5e20', Cancelled:'#c62828' };

  return (
    <div style={{ paddingTop:68, minHeight:'100vh', background:'var(--cream)' }}>
      <div style={{ background:'linear-gradient(135deg,var(--cream-dark),var(--pink-light))', padding:'50px 0 36px' }}>
        <div className="container">
          <p className="section-label">Account</p>
          <h1 className="page-title">My Orders</h1>
          <p style={{ color:'var(--brown-light)', marginTop:6 }}>Track and manage all your SweetCrumbs orders</p>
        </div>
      </div>
      <div className="container" style={{ padding:'36px 5vw 80px' }}>
        {loading ? <div className="spinner" /> : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:'80px 20px', color:'var(--brown-light)' }}>
            <span style={{ fontSize:64, display:'block', marginBottom:16 }}>📦</span>
            <h2 style={{ fontFamily:'var(--ff-display)', fontSize:24, color:'var(--brown)', marginBottom:8 }}>No orders yet</h2>
            <p style={{ marginBottom:24 }}>Place your first order and see it here!</p>
            <button className="btn-primary" onClick={() => navigate('/products')}>Browse Products</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {orders.map(o => (
              <div key={o._id} style={{ background:'var(--white)', borderRadius:16, padding:20, boxShadow:'var(--shadow-sm)', display:'flex', gap:20, alignItems:'center', cursor:'pointer', transition:'var(--transition)' }}
                onClick={() => navigate(`/orders/${o._id}`)}
                onMouseEnter={e => e.currentTarget.style.boxShadow='var(--shadow)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow='var(--shadow-sm)'}
              >
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <p style={{ fontFamily:'var(--ff-display)', fontSize:16, fontWeight:700, color:'var(--brown)' }}>#{o.orderNumber}</p>
                    <span style={{ padding:'4px 12px', borderRadius:'999px', fontSize:11, fontWeight:700, background: statusColors[o.orderStatus]+'22', color: statusColors[o.orderStatus] }}>{o.orderStatus}</span>
                  </div>
                  <p style={{ fontSize:13, color:'var(--brown-light)', marginBottom:4 }}>
                    {o.orderItems.length} item(s) · ₹{o.totalPrice.toLocaleString('en-IN')} · {o.paymentMethod}
                  </p>
                  <p style={{ fontSize:12, color:'var(--brown-light)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}</p>
                </div>
                <span style={{ fontSize:20, color:'var(--brown-light)' }}>›</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { MyOrdersPage };
