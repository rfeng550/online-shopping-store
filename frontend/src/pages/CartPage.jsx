import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div style={styles.page}>
        <div style={styles.successBox}>
          <span style={styles.successIcon}>🛒</span>
          <h2 style={styles.successTitle}>Your cart is empty</h2>
          <p style={styles.successSub}>Looks like you haven't added anything yet.</p>
          <Link to="/products" style={styles.continueBtn}>Browse Products</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* Breadcrumb */}
      <nav style={styles.breadcrumb}>
        <Link to="/" style={styles.crumbLink}>Home</Link>
        <span style={styles.crumbSep}>/</span>
        <Link to="/products" style={styles.crumbLink}>Store</Link>
        <span style={styles.crumbSep}>/</span>
        <span style={styles.crumbCurrent}>Shopping Cart</span>
      </nav>

      <h1 style={styles.pageTitle}>Shopping Cart</h1>

      <div style={styles.layout}>

        {/* ── Cart Items ── */}
        <div style={styles.itemsList}>
          {cart.map((item) => (
            <div key={item.id} style={styles.itemRow}>
              <img src={item.image} alt={item.name} style={styles.itemImage} />
              <div style={styles.itemInfo}>
                <Link to={`/products/${item.id}`} style={styles.itemName}>{item.name}</Link>
                <span style={styles.itemCategory}>{item.category}</span>
                <p style={styles.itemPrice}>${item.price.toFixed(2)} each</p>
              </div>

              {/* Quantity controls */}
              <div style={styles.qtyWrapper}>
                <button
                  style={styles.qtyBtn}
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                >−</button>
                <span style={styles.qtyNum}>{item.quantity}</span>
                <button
                  style={styles.qtyBtn}
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >+</button>
              </div>

              <div style={styles.itemSubtotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>

              <button style={styles.removeBtn} onClick={() => removeFromCart(item.id)}>✕</button>
            </div>
          ))}
        </div>

        {/* ── Order Summary ── */}
        <div style={styles.summary}>
          <h2 style={styles.summaryTitle}>Order Summary</h2>

          <div style={styles.summaryRow}>
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Shipping</span>
            <span style={{ color: '#38a169' }}>Free</span>
          </div>
          <div style={styles.summaryRow}>
            <span>Tax (8%)</span>
            <span>${(cartTotal * 0.08).toFixed(2)}</span>
          </div>

          <hr style={styles.summaryDivider} />

          <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
            <span>Total</span>
            <span>${(cartTotal * 1.08).toFixed(2)}</span>
          </div>

          <button style={styles.checkoutBtn} onClick={() => navigate('/checkout')}>
            Go to Checkout →
          </button>

          <button style={styles.continueShoppingBtn} onClick={() => navigate('/products')}>
            ← Continue Shopping
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7f8fc',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '40px 24px',
  },

  /* Breadcrumb */
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    maxWidth: '1100px',
    margin: '0 auto 24px',
    fontSize: '14px',
  },
  crumbLink: { color: '#6366f1', textDecoration: 'none', fontWeight: '500' },
  crumbSep: { color: '#a0aec0' },
  crumbCurrent: { color: '#4a5568', fontWeight: '600' },

  pageTitle: {
    maxWidth: '1100px',
    margin: '0 auto 32px',
    fontSize: '32px',
    fontWeight: '800',
    color: '#1a202c',
  },

  /* Two-column layout */
  layout: {
    display: 'flex',
    gap: '28px',
    maxWidth: '1100px',
    margin: '0 auto',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  /* Items list */
  itemsList: {
    flex: '1 1 500px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    flexWrap: 'wrap',
  },
  itemImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '10px',
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '120px',
  },
  itemName: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a202c',
    textDecoration: 'none',
  },
  itemCategory: {
    fontSize: '12px',
    color: '#3182ce',
    backgroundColor: '#ebf4ff',
    padding: '2px 8px',
    borderRadius: '20px',
    width: 'fit-content',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemPrice: {
    fontSize: '13px',
    color: '#718096',
    margin: 0,
  },

  /* Qty controls */
  qtyWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f7f8fc',
    borderRadius: '8px',
    padding: '4px 8px',
  },
  qtyBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    color: '#4a5568',
  },
  qtyNum: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#1a202c',
    minWidth: '20px',
    textAlign: 'center',
  },

  itemSubtotal: {
    fontSize: '17px',
    fontWeight: '800',
    color: '#2d3748',
    minWidth: '70px',
    textAlign: 'right',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#a0aec0',
    fontSize: '16px',
    cursor: 'pointer',
    padding: '4px',
    flexShrink: 0,
  },

  /* Summary box */
  summary: {
    flex: '0 0 300px',
    backgroundColor: '#fff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    position: 'sticky',
    top: '24px',
  },
  summaryTitle: {
    margin: '0 0 4px',
    fontSize: '18px',
    fontWeight: '800',
    color: '#1a202c',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#4a5568',
  },
  summaryDivider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '4px 0',
  },
  summaryTotal: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#1a202c',
  },
  checkoutBtn: {
    marginTop: '8px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#fff',
    background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
  },
  continueShoppingBtn: {
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#6366f1',
    backgroundColor: '#eef2ff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
  },

  /* Empty / Success */
  successBox: {
    maxWidth: '420px',
    margin: '120px auto 0',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  successIcon: { fontSize: '56px' },
  successTitle: { fontSize: '24px', fontWeight: '800', color: '#1a202c', margin: 0 },
  successSub: { fontSize: '15px', color: '#718096', margin: 0 },
  continueBtn: {
    marginTop: '8px',
    padding: '12px 32px',
    fontSize: '15px',
    fontWeight: '700',
    color: '#fff',
    background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
    borderRadius: '50px',
    textDecoration: 'none',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
  },
};
