import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import './ProductsPage.css';

const CATEGORIES = ['All', 'Cakes', 'Cupcakes', 'Brownies', 'Hampers'];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);

  const initCat = searchParams.get('category') || 'All';
  const [category, setCategory] = useState(initCat);
  const [search,   setSearch]   = useState('');
  const [sort,     setSort]     = useState('');

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (category !== 'All') params.category = category;
      if (search)  params.search = search;
      if (sort)    params.sort   = sort;
      const { data } = await productAPI.getAll(params);
      setProducts(data.products);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Sync category from URL
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) setCategory(cat);
  }, [searchParams]);

  const handleCategory = (cat) => {
    setCategory(cat);
    setPage(1);
    if (cat !== 'All') setSearchParams({ category: cat });
    else setSearchParams({});
  };

  const handleSearch = (e) => { setSearch(e.target.value); setPage(1); };

  return (
    <div className="products-page" style={{ paddingTop: 68 }}>
      {/* Hero */}
      <div className="products-hero">
        <div className="container">
          <p className="section-label">Our Menu</p>
          <h1 className="page-title">All Products</h1>
          <p>Handcrafted fresh every morning — choose your treat!</p>
        </div>
      </div>

      <div className="container products-layout">
        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-input"
              type="text"
              placeholder="Search cakes, cupcakes, brownies..."
              value={search}
              onChange={handleSearch}
            />
          </div>
          <div className="category-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`filter-pill ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategory(cat)}
              >
                {cat === 'Cakes' ? '🎂' : cat === 'Cupcakes' ? '🧁' : cat === 'Brownies' ? '🍫' : cat === 'Hampers' ? '🎁' : ''} {cat}
              </button>
            ))}
          </div>
          <select className="sort-select" value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
            <option value="">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Top Rated</option>
            <option value="newest">Newest</option>
          </select>
        </div>

        {/* Results count */}
        <p className="results-count">{total} product{total !== 1 ? 's' : ''} found</p>

        {/* Grid */}
        {loading ? (
          <div className="spinner" />
        ) : products.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <h3>No products found</h3>
            <p>Try a different search or category</p>
          </div>
        ) : (
          <div className="products-grid-full">
            {products.map(p => <ProductCard key={p._id} product={p} />)}
          </div>
        )}

        {/* Pagination */}
        {total > 12 && (
          <div className="pagination">
            {Array.from({ length: Math.ceil(total / 12) }, (_, i) => i + 1).map(n => (
              <button key={n} className={`page-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>
                {n}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsPage;
