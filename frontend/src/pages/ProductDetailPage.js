import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { addItem }  = useCart();
  const { user }     = useAuth();

  const [product,  setProduct]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selImg,   setSelImg]   = useState(0);
  const [qty,      setQty]      = useState(1);
  const [size,     setSize]     = useState('');
  const [flavour,  setFlavour]  = useState('');
  const [message,  setMessage]  = useState('');
  const [price,    setPrice]    = useState(0);
  const [rating,   setRating]   = useState(5);
  const [comment,  setComment]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    productAPI.getById(id)
      .then(r => {
        setProduct(r.data.product);
        setPrice(r.data.product.price);
        if (r.data.product.sizeOptions?.length) setSize(r.data.product.sizeOptions[0].label);
        if (r.data.product.flavourOptions?.length) setFlavour(r.data.product.flavourOptions[0]);
      })
      .catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  // Update price when size changes
  useEffect(() => {
    if (!product) return;
    if (size && product.sizeOptions?.length) {
      const opt = product.sizeOptions.find(s => s.label === size);
      if (opt) setPrice(opt.price);
    } else {
      setPrice(product.price);
    }
  }, [size, product]);

  const handleAddToCart = () => {
    addItem(product, { selectedSize: size, selectedFlavour: flavour, customMessage: message, qty });
  };

  const handleWA = () => {
    const msg = `Hi! I'd like to order:\n🎂 ${product.name}\nSize: ${size || 'Standard'}\nFlavour: ${flavour || 'Default'}\nMessage on cake: ${message || 'None'}\nQty: ${qty}\nTotal: ₹${(price * qty).toLocaleString('en-IN')}`;
    window.open(`https://wa.me/${process.env.REACT_APP_WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to leave a review'); return navigate('/login'); }
    setSubmitting(true);
    try {
      await productAPI.addReview(id, { rating, comment });
      toast.success('Review submitted! Thank you 🎉');
      const r = await productAPI.getById(id);
      setProduct(r.data.product);
      setComment(''); setRating(5);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!product) return null;

  return (
    <div className="detail-page" style={{ paddingTop: 68 }}>
      <div className="container detail-inner">

        {/* Breadcrumb */}
        <p className="breadcrumb">
          <span onClick={() => navigate('/')} style={{ cursor:'pointer' }}>Home</span> /{' '}
          <span onClick={() => navigate('/products')} style={{ cursor:'pointer' }}>Products</span> /{' '}
          <span style={{ color: 'var(--brown)', fontWeight:600 }}>{product.name}</span>
        </p>

        <div className="detail-layout">
          {/* Images */}
          <div className="detail-images">
            <div className="main-img-wrap">
              <img
                src={product.images?.[selImg]?.url || '/placeholder.jpg'}
                alt={product.name}
                className="main-img"
              />
              {product.badge && (
                <span className={`badge badge-${product.badge} detail-badge`}>
                  {product.badge === 'bestseller' ? '🔥 Best Seller' : product.badge === 'new' ? '✨ New' : '⭐ Special'}
                </span>
              )}
            </div>
            {product.images?.length > 1 && (
              <div className="thumb-row">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.url}
                    alt=""
                    className={`thumb ${selImg === i ? 'active' : ''}`}
                    onClick={() => setSelImg(i)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="detail-info">
            <p className="detail-cat">{product.category}</p>
            <h1 className="detail-name">{product.name}</h1>
            <div className="detail-meta">
              <span className="stars">{'★'.repeat(Math.round(product.rating))}{'☆'.repeat(5 - Math.round(product.rating))}</span>
              <span className="meta-text">{product.rating} ({product.numReviews} reviews)</span>
              {product.weight   && <span className="meta-pill">⚖️ {product.weight}</span>}
              {product.servings && <span className="meta-pill">👥 {product.servings}</span>}
            </div>

            <div className="detail-pricing">
              <span className="detail-price">₹{price.toLocaleString('en-IN')}</span>
              {product.discountPrice > product.price && (
                <span className="detail-original">₹{product.discountPrice.toLocaleString('en-IN')}</span>
              )}
            </div>

            <p className="detail-desc">{product.description}</p>

            {/* Size options */}
            {product.sizeOptions?.length > 0 && (
              <div className="option-group">
                <label className="option-label">Select Size</label>
                <div className="option-pills">
                  {product.sizeOptions.map(s => (
                    <button
                      key={s.label}
                      className={`option-pill ${size === s.label ? 'active' : ''}`}
                      onClick={() => setSize(s.label)}
                    >
                      {s.label} — ₹{s.price.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flavour options */}
            {product.flavourOptions?.length > 0 && (
              <div className="option-group">
                <label className="option-label">Select Flavour</label>
                <div className="option-pills">
                  {product.flavourOptions.map(f => (
                    <button
                      key={f}
                      className={`option-pill ${flavour === f ? 'active' : ''}`}
                      onClick={() => setFlavour(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom message */}
            {product.customizable && (
              <div className="option-group">
                <label className="option-label">🎂 Custom Message on Cake (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Happy Birthday Priya! 🎉"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={60}
                />
                <small style={{ color:'var(--brown-light)', fontSize:11 }}>{60 - message.length} characters remaining</small>
              </div>
            )}

            {/* Quantity */}
            <div className="qty-row">
              <label className="option-label" style={{ margin:0 }}>Quantity</label>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                <span className="qty-num">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
              </div>
              <span className="qty-total">Total: ₹{(price * qty).toLocaleString('en-IN')}</span>
            </div>

            {/* Actions */}
            <div className="detail-actions">
              <button className="btn-primary detail-action-btn" onClick={handleAddToCart}>
                🛒 Add to Cart
              </button>
              <button className="btn-wa detail-action-btn" onClick={handleWA}>
                📱 Order via WhatsApp
              </button>
              <button className="btn-outline detail-action-btn" onClick={() => navigate('/cart')}>
                View Cart
              </button>
            </div>

            {/* Allergens */}
            {product.allergens?.length > 0 && (
              <div className="allergen-box">
                <strong>⚠️ Allergens:</strong> {product.allergens.join(', ')}
              </div>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <h2 className="section-title" style={{ fontSize:24, marginBottom:24 }}>
            Customer Reviews ({product.numReviews})
          </h2>

          {/* Review list */}
          {product.reviews?.length === 0 ? (
            <p style={{ color:'var(--brown-light)' }}>No reviews yet. Be the first!</p>
          ) : (
            <div className="reviews-list">
              {product.reviews.map(r => (
                <div key={r._id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">{r.name[0]}</div>
                    <div>
                      <p className="review-name">{r.name}</p>
                      <p className="stars" style={{ fontSize:13 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</p>
                    </div>
                    <span className="review-date">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                  </div>
                  <p className="review-text">{r.comment}</p>
                </div>
              ))}
            </div>
          )}

          {/* Write review */}
          <div className="write-review">
            <h3>Write a Review</h3>
            <form onSubmit={handleReview}>
              <div className="star-picker">
                {[1,2,3,4,5].map(n => (
                  <button type="button" key={n} className={`star-btn ${rating >= n ? 'active' : ''}`} onClick={() => setRating(n)}>★</button>
                ))}
                <span style={{ fontSize:13, color:'var(--brown-light)', marginLeft:8 }}>({rating}/5)</span>
              </div>
              <div className="form-group" style={{ marginTop:12 }}>
                <textarea
                  className="form-control"
                  placeholder="Share your experience..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
