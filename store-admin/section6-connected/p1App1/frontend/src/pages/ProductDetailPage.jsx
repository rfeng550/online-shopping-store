import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  // --- API state ---
  const [product, setProduct]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded]       = useState(false);

  // Fetch the single product by id from the Flask API
  useEffect(() => {
    fetch(`http://localhost:5001/api/products/${id}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) {
          setProduct(data);
          setLoading(false);
        }
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]); // re-fetch if the id in the URL changes

  // --- Loading state ---
  if (loading) {
    return (
      <div style={styles.notFound}>
        <p>Loading product…</p>
      </div>
    );
  }

  // --- Not found / error state ---
  if (notFound || !product) {
    return (
      <div style={styles.notFound}>
        <h2>Product not found 😕</h2>
        <Link to="/products" style={styles.backLink}>← Back to Store</Link>
      </div>
    );
  }

  // Destructure fields from the API response.
  // The API returns on_sale (snake_case) — map it to onSale for JSX readability.
  const { name, price, image, category, stock, description, on_sale } = product;
  const onSale = Boolean(on_sale);

  let stockLabel, stockColor;
  if (stock === 0) { stockLabel = 'Out of Stock'; stockColor = '#e53e3e'; }
  else if (stock < 10) { stockLabel = 'Low Stock'; stockColor = '#dd6b20'; }
  else { stockLabel = 'In Stock'; stockColor = '#38a169'; }

  const handleAddToCart = () => {
    if (stock === 0) return;
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div style={styles.page}>

      {/* Cart badge */}
      <Link to="/cart" style={styles.cartBadge}>
        🛒 Cart {cartCount > 0 && <span style={styles.cartCount}>{cartCount}</span>}
      </Link>

      {/* ── Breadcrumb ── */}
      <nav style={styles.breadcrumb}>
        <Link to="/" style={styles.crumbLink}>Home</Link>
        <span style={styles.crumbSep}>/</span>
        <Link to="/products" style={styles.crumbLink}>Store</Link>
        <span style={styles.crumbSep}>/</span>
        <span style={styles.crumbCurrent}>{name}</span>
      </nav>

      {/* ── Product Card ── */}
      <div style={styles.container}>

        {/* Left: Image */}
        <div style={styles.imageWrapper}>
          {onSale && <span style={styles.saleBadge}>Sale!</span>}
          <img src={image} alt={name} style={styles.image} />
        </div>

        {/* Right: Details */}
        <div style={styles.details}>

          {/* Category badge */}
          <span style={styles.categoryBadge}>{category}</span>

          {/* Name */}
          <h1 style={styles.name}>{name}</h1>

          {/* Price */}
          <p style={styles.price}>${price.toFixed(2)}</p>

          {/* Stock */}
          <p style={{ ...styles.stock, color: stockColor }}>
            ● {stockLabel}&nbsp;
            <span style={styles.stockCount}>({stock} units left)</span>
          </p>

          {/* Divider */}
          <hr style={styles.divider} />

          {/* Description */}
          <h3 style={styles.descTitle}>About this product</h3>
          <p style={styles.description}>{description}</p>

          {/* Divider */}
          <hr style={styles.divider} />

          {/* Buttons */}
          <div style={styles.btnRow}>
            <button
              style={{
                ...styles.cartBtn,
                ...(stock === 0 ? styles.cartBtnDisabled : {}),
                ...(added ? styles.cartBtnAdded : {}),
              }}
              disabled={stock === 0}
              onClick={handleAddToCart}
            >
              {stock === 0 ? 'Unavailable' : added ? '✓ Added to Cart!' : 'Add to Cart'}
            </button>

            <button style={styles.backBtn} onClick={() => navigate(-1)}>
              ← Go Back
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fafaf8',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: '40px 24px',
  },

  /* Breadcrumb */
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '1000px',
    margin: '0 auto 32px',
    fontSize: '13px',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  crumbLink: {
    color: '#555',
    textDecoration: 'underline',
    fontWeight: '400',
  },
  crumbSep: {
    color: '#bbb',
  },
  crumbCurrent: {
    color: '#222',
    fontWeight: '600',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },

  /* Main layout */
  container: {
    display: 'flex',
    gap: '0',
    maxWidth: '1000px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '4px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    flexWrap: 'wrap',
    border: '1px solid #e0ddd8',
  },

  /* Image */
  imageWrapper: {
    position: 'relative',
    flex: '1 1 360px',
    minHeight: '420px',
    backgroundColor: '#f5f3ef',
    borderRight: '1px solid #e0ddd8',
  },
  saleBadge: {
    position: 'absolute',
    top: '16px',
    left: '16px',
    backgroundColor: '#c0392b',
    color: '#fff',
    fontSize: '11px',
    fontWeight: '700',
    padding: '4px 10px',
    borderRadius: '2px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    zIndex: 1,
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    minHeight: '420px',
  },

  /* Details */
  details: {
    flex: '1 1 320px',
    padding: '40px 40px 40px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  categoryBadge: {
    display: 'inline-block',
    backgroundColor: 'transparent',
    color: '#777',
    fontSize: '11px',
    fontWeight: '600',
    padding: '0',
    borderRadius: '0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    width: 'fit-content',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  name: {
    margin: 0,
    fontSize: '26px',
    fontWeight: '400',
    color: '#1a1a1a',
    lineHeight: '1.3',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  price: {
    margin: 0,
    fontSize: '28px',
    fontWeight: '600',
    color: '#1a1a1a',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  stock: {
    margin: 0,
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  stockCount: {
    color: '#999',
    fontWeight: '400',
  },
  divider: {
    border: 'none',
    borderTop: '1px solid #e8e5e0',
    margin: '2px 0',
  },
  descTitle: {
    margin: 0,
    fontSize: '11px',
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  description: {
    margin: 0,
    fontSize: '15px',
    color: '#444',
    lineHeight: '1.8',
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },

  /* Buttons */
  btnRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  cartBtn: {
    flex: 1,
    minWidth: '160px',
    padding: '13px 24px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#fff',
    background: '#1a1a1a',
    border: '1px solid #1a1a1a',
    borderRadius: '3px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    transition: 'background 0.15s ease',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },
  cartBtnAdded: {
    background: '#2e6b3e',
    border: '1px solid #2e6b3e',
  },
  cartBtnDisabled: {
    background: '#ccc',
    border: '1px solid #ccc',
    color: '#fff',
    cursor: 'not-allowed',
  },
  backBtn: {
    padding: '13px 20px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#444',
    backgroundColor: '#fff',
    border: '1px solid #ccc',
    borderRadius: '3px',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
  },

  /* Not found */
  notFound: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    color: '#444',
  },
  backLink: {
    color: '#333',
    fontWeight: '600',
    textDecoration: 'underline',
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
    backgroundColor: '#1a1a1a',
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
