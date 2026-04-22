import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function ProductStorePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { cartCount } = useCart();

  // --- API state ---
  const [products, setProducts] = useState([]);   // fetched from Flask
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Fetch all products from the Flask API when the page first loads
  useEffect(() => {
    fetch('http://localhost:5001/api/products')
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Could not load products. Is the Flask server running?');
        setLoading(false);
      });
  }, []); // empty array = run once on mount

  // Derive unique categories from the fetched data
  const categories = ['all', ...new Set(products.map((p) => p.category))];

  const filteredProducts = products.filter((p) => {
    const q = query.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const scrollToProducts = () => {
    document.getElementById('products-grid').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={styles.page}>

      {/* Fixed cart badge */}
      <Link to="/cart" style={styles.cartBadge}>
        🛒 Cart {cartCount > 0 && <span style={styles.cartCount}>{cartCount}</span>}
      </Link>

      {/* ── Hero Section ── */}
      <section style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <p style={styles.heroEyebrow}>🔥 New Arrivals · Limited Stock</p>
          <h1 style={styles.heroTitle}>
            The Best Tech,<br />Right at Your Fingertips.
          </h1>
          <p style={styles.heroSubtitle}>
            Laptops, tablets, audio gear, and accessories — curated for students and professionals.
          </p>
          <button style={styles.heroBtn} onClick={scrollToProducts}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Shop Now ↓
          </button>
        </div>
      </section>

      {/* ── Search + Category Bar ── */}
      <div style={styles.searchWrapper}>
        {/* Search input */}
        <div style={styles.searchBox}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            style={styles.searchInput}
            type="text"
            placeholder="Search by name, category, or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button style={styles.clearBtn} onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        {/* Category buttons */}
        <div style={styles.categoryRow}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                ...styles.catBtn,
                ...(activeCategory === cat ? styles.catBtnActive : {}),
              }}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products Grid ── */}
      <main id="products-grid" style={styles.section}>
        <h2 style={styles.sectionTitle}>
          {activeCategory === 'all' ? 'All Products' : activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
        </h2>
        <p style={styles.sectionSub}>
          {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
          {query ? ` matching "${query}"` : ''}
        </p>
        <div style={styles.grid}>
          {/* Loading state */}
          {loading && (
            <p style={styles.noResults}>Loading products…</p>
          )}

          {/* Error state — shown if Flask is not running or fetch failed */}
          {error && (
            <p style={{ ...styles.noResults, color: '#e53e3e' }}>⚠️ {error}</p>
          )}

          {/* Product cards — on_sale (snake_case from API) mapped to onSale (camelCase for ProductCard) */}
          {!loading && !error && (filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onSale={Boolean(product.on_sale)}
              />
            ))
          ) : (
            <p style={styles.noResults}>
              No products found{query ? ` for "${query}"` : ''} in this category 😕
            </p>
          ))}
        </div>
      </main>

    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fafaf8',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },

  /* Hero */
  hero: {
    position: 'relative',
    minHeight: '72vh',
    background: '#1c1c1a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    display: 'none',
  },
  heroContent: {
    position: 'relative',
    textAlign: 'center',
    padding: '0 24px',
    maxWidth: '720px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  heroEyebrow: {
    fontSize: '11px',
    fontWeight: '600',
    letterSpacing: '2.5px',
    textTransform: 'uppercase',
    color: '#aaa',
    margin: 0,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  heroTitle: {
    fontSize: 'clamp(32px, 5vw, 56px)',
    fontWeight: '400',
    color: '#fff',
    lineHeight: '1.2',
    margin: 0,
    letterSpacing: '-0.5px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  heroSubtitle: {
    fontSize: '16px',
    color: '#999',
    maxWidth: '480px',
    lineHeight: '1.75',
    margin: 0,
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  heroBtn: {
    marginTop: '12px',
    padding: '14px 40px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1c1c1a',
    background: '#fff',
    border: '1px solid #fff',
    borderRadius: '3px',
    cursor: 'pointer',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
    transition: 'background 0.15s ease, color 0.15s ease',
  },

  /* Products section */
  section: {
    padding: '64px 24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '400',
    color: '#1a1a1a',
    margin: '0 0 4px',
    textAlign: 'center',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  sectionSub: {
    fontSize: '13px',
    color: '#999',
    margin: '0 0 40px',
    textAlign: 'center',
    letterSpacing: '0.3px',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    justifyContent: 'center',
  },

  /* Search */
  searchWrapper: {
    backgroundColor: '#f0ede8',
    borderBottom: '1px solid #ddd8d0',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
  },
  categoryRow: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  catBtn: {
    padding: '6px 16px',
    borderRadius: '2px',
    border: '1px solid transparent',
    backgroundColor: 'transparent',
    color: '#777',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    transition: 'all 0.15s ease',
  },
  catBtnActive: {
    backgroundColor: '#1c1c1a',
    borderColor: '#1c1c1a',
    color: '#fff',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '2px',
    padding: '9px 16px',
    width: '100%',
    maxWidth: '520px',
    gap: '10px',
  },
  searchIcon: {
    fontSize: '15px',
    flexShrink: 0,
    color: '#999',
  },
  searchInput: {
    flex: 1,
    background: 'none',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#222',
    caretColor: '#555',
  },
  clearBtn: {
    background: 'none',
    border: 'none',
    color: '#aaa',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '0 4px',
    flexShrink: 0,
  },
  noResults: {
    color: '#999',
    fontSize: '15px',
    textAlign: 'center',
    width: '100%',
    padding: '48px 0',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },

  /* Cart badge */
  cartBadge: {
    position: 'fixed',
    top: '20px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '3px',
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#1a1a1a',
    textDecoration: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    zIndex: 100,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  cartCount: {
    backgroundColor: '#1c1c1a',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    borderRadius: '50%',
    width: '20px',
    height: '20px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};
