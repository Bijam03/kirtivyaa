import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addItem } = useCart();
  const navigate    = useNavigate();
  const [adding, setAdding] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    setAdding(true);
    addItem(product);
    setTimeout(() => setAdding(false), 800);
  };

  const price = product.discountPrice && product.discountPrice > product.price
    ? product.price
    : product.price;
  const original = product.discountPrice && product.discountPrice > product.price
    ? product.discountPrice
    : null;

  return (
    <div className="product-card card" onClick={() => navigate(`/products/${product._id}`)}>
      <div className="product-img-wrap">
        <img
          src={product.images?.[0]?.url || '/placeholder-cake.jpg'}
          alt={product.name}
          className="product-img"
          loading="lazy"
        />
        {product.badge && (
          <span className={`badge badge-${product.badge} product-badge`}>
            {product.badge === 'bestseller' ? '🔥 Best Seller' : product.badge === 'new' ? '✨ New' : '⭐ Special'}
          </span>
        )}
        {original && (
          <span className="discount-tag">
            {Math.round(((original - price) / original) * 100)}% OFF
          </span>
        )}
        <button
          className={`quick-add ${adding ? 'added' : ''}`}
          onClick={handleAdd}
        >
          {adding ? '✓' : '+'}
        </button>
      </div>

      <div className="product-body">
        <p className="product-category">{product.category}</p>
        <h3 className="product-name">{product.name}</h3>
        <span className="pure-veg-tag">🟢 Pure Veg</span>
        <p className="product-desc">{product.shortDescription || product.description?.slice(0, 80) + '…'}</p>
        {product.weight && <p className="product-meta">⚖️ {product.weight} · 👥 {product.servings}</p>}
        <div className="product-footer">
          <div className="product-pricing">
            <span className="product-price">₹{price.toLocaleString('en-IN')}</span>
            {original && <span className="product-original">₹{original.toLocaleString('en-IN')}</span>}
          </div>
          <div className="product-rating">
            <span className="stars">{'★'.repeat(Math.round(product.rating))}</span>
            <span className="rating-count">({product.numReviews})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
