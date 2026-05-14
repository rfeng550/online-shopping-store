import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Standard Shipping', days: '5–7 business days', fee: 0 },
  { id: 'express', label: 'Express Shipping', days: '2–3 business days', fee: 9.99 },
  { id: 'overnight', label: 'Overnight Shipping', days: 'Next business day', fee: 24.99 },
];

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', state: '', zip: '', country: '',
  });
  const [shipping, setShipping] = useState('standard');
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(false);

  const shippingFee = SHIPPING_OPTIONS.find((o) => o.id === shipping).fee;
  const tax = cartTotal * 0.08;
  const total = cartTotal + shippingFee + tax;

  const [checkoutError, setCheckoutError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = 'Required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    if (!form.address.trim()) e.address = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.state.trim()) e.state = 'Required';
    if (!form.zip.trim()) e.zip = 'Required';
    if (!form.country.trim()) e.country = 'Required';
    return e;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handlePlaceOrder = async () => {
    setCheckoutError('');
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const items = cart.map(item => ({ id: item.id, quantity: item.quantity }));
    const token = localStorage.getItem('token');
    
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_URL}/api/checkout`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ items, phone: form.phone })
      });

      const data = await res.json();
      if (!res.ok) {
        setCheckoutError(data.error || 'Failed to place order');
        return;
      }
      
      // If checked out as guest, save order ID to local storage
      if (!token && data.order_id) {
        const storedOrders = JSON.parse(localStorage.getItem('guestOrders') || '[]');
        storedOrders.push(data.order_id);
        localStorage.setItem('guestOrders', JSON.stringify(storedOrders));
      }

      clearCart();
      setPlaced(true);
    } catch (err) {
      setCheckoutError('Network error during checkout');
    }
  };

  if (cart.length === 0 && !placed) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyBox}>
          <span style={styles.emptyIcon}>🛒</span>
          <h2 style={styles.emptyTitle}>Nothing to checkout</h2>
          <Link to="/products" style={styles.linkBtn}>Browse Products</Link>
        </div>
      </div>
    );
  }

  if (placed) {
    return (
      <div style={styles.page}>
        <div style={styles.emptyBox}>
          <span style={styles.emptyIcon}>🎉</span>
          <h2 style={styles.emptyTitle}>Order Confirmed!</h2>
          <p style={styles.emptySub}>
            Thank you, <strong>{form.fullName}</strong>! Your order is on its way to <strong>{form.city}</strong>.
          </p>
          <Link to="/products" style={styles.linkBtn}>Continue Shopping</Link>
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
        <Link to="/cart" style={styles.crumbLink}>Cart</Link>
        <span style={styles.crumbSep}>/</span>
        <span style={styles.crumbCurrent}>Checkout</span>
      </nav>

      <h1 style={styles.pageTitle}>Checkout</h1>

      <div style={styles.layout}>

        {/* ── LEFT: Form ── */}
        <div style={styles.formCol}>

          {/* Shipping Address */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>📦 Shipping Address</h2>

            <div style={styles.row2}>
              <Field label="Full Name" error={errors.fullName}>
                <input style={inp(errors.fullName)} placeholder="Jane Smith"
                  value={form.fullName} onChange={handleChange('fullName')} />
              </Field>
              <Field label="Email" error={errors.email}>
                <input style={inp(errors.email)} placeholder="jane@email.com" type="email"
                  value={form.email} onChange={handleChange('email')} />
              </Field>
            </div>

            <Field label="Phone (optional)">
              <input style={inp()} placeholder="+1 (555) 000-0000" type="tel"
                value={form.phone} onChange={handleChange('phone')} />
            </Field>

            <Field label="Street Address" error={errors.address}>
              <input style={inp(errors.address)} placeholder="123 Main St, Apt 4B"
                value={form.address} onChange={handleChange('address')} />
            </Field>

            <div style={styles.row3}>
              <Field label="City" error={errors.city}>
                <input style={inp(errors.city)} placeholder="New York"
                  value={form.city} onChange={handleChange('city')} />
              </Field>
              <Field label="State / Province" error={errors.state}>
                <input style={inp(errors.state)} placeholder="NY"
                  value={form.state} onChange={handleChange('state')} />
              </Field>
              <Field label="ZIP / Postal Code" error={errors.zip}>
                <input style={inp(errors.zip)} placeholder="10001"
                  value={form.zip} onChange={handleChange('zip')} />
              </Field>
            </div>

            <Field label="Country" error={errors.country}>
              <select style={inp(errors.country)} value={form.country} onChange={handleChange('country')}>
                <option value="">Select country…</option>
                {['United States','Canada','United Kingdom','Australia','Germany','France','Japan','Other'].map(c=>(
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </Field>
          </section>

          {/* Shipping Options */}
          <section style={styles.card}>
            <h2 style={styles.cardTitle}>🚚 Shipping Method</h2>
            <div style={styles.shippingList}>
              {SHIPPING_OPTIONS.map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    ...styles.shippingOption,
                    ...(shipping === opt.id ? styles.shippingOptionActive : {}),
                  }}
                >
                  <input
                    type="radio"
                    name="shipping"
                    value={opt.id}
                    checked={shipping === opt.id}
                    onChange={() => setShipping(opt.id)}
                    style={{ display: 'none' }}
                  />
                  <div style={styles.shippingRadio}>
                    {shipping === opt.id && <div style={styles.shippingRadioDot} />}
                  </div>
                  <div style={styles.shippingInfo}>
                    <span style={styles.shippingLabel}>{opt.label}</span>
                    <span style={styles.shippingDays}>{opt.days}</span>
                  </div>
                  <span style={styles.shippingFee}>
                    {opt.fee === 0 ? <span style={{ color: '#38a169', fontWeight: '700' }}>Free</span> : `$${opt.fee.toFixed(2)}`}
                  </span>
                </label>
              ))}
            </div>
          </section>

        </div>

        {/* ── RIGHT: Order Summary ── */}
        <div style={styles.summaryCol}>
          <div style={styles.summaryBox}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>

            {/* Product list */}
            <div style={styles.productList}>
              {cart.map((item) => (
                <div key={item.id} style={styles.productRow}>
                  <img src={item.image} alt={item.name} style={styles.productThumb} />
                  <div style={styles.productMeta}>
                    <span style={styles.productName}>{item.name}</span>
                    <span style={styles.productQty}>× {item.quantity}</span>
                  </div>
                  <span style={styles.productSubtotal}>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <hr style={styles.divider} />

            {/* Price breakdown */}
            <div style={styles.priceRow}><span>Subtotal</span><span>${cartTotal.toFixed(2)}</span></div>
            <div style={styles.priceRow}>
              <span>Shipping</span>
              <span>{shippingFee === 0 ? <span style={{ color: '#38a169' }}>Free</span> : `$${shippingFee.toFixed(2)}`}</span>
            </div>
            <div style={styles.priceRow}><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>

            <hr style={styles.divider} />

            <div style={{ ...styles.priceRow, ...styles.totalRow }}>
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            {checkoutError && (
              <div style={{ color: '#e53e3e', fontSize: '14px', marginTop: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                {checkoutError}
              </div>
            )}

            <button style={styles.placeBtn} onClick={handlePlaceOrder}>
              Place Order →
            </button>

            <Link to="/cart" style={styles.backLink}>← Back to Cart</Link>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Helper components ── */
function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '13px', fontWeight: '600', color: error ? '#e53e3e' : '#4a5568' }}>
        {label}{error && <span style={{ marginLeft: '6px', fontWeight: '400' }}>— {error}</span>}
      </label>
      {children}
    </div>
  );
}

function inp(error) {
  return {
    padding: '10px 14px',
    borderRadius: '8px',
    border: `1.5px solid ${error ? '#e53e3e' : '#e2e8f0'}`,
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    color: '#1a202c',
    fontFamily: "'Segoe UI', sans-serif",
  };
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7f8fc',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '40px 24px 80px',
  },

  breadcrumb: {
    display: 'flex', alignItems: 'center', gap: '8px',
    maxWidth: '1100px', margin: '0 auto 24px', fontSize: '14px',
  },
  crumbLink: { color: '#6366f1', textDecoration: 'none', fontWeight: '500' },
  crumbSep: { color: '#a0aec0' },
  crumbCurrent: { color: '#4a5568', fontWeight: '600' },

  pageTitle: {
    maxWidth: '1100px', margin: '0 auto 32px',
    fontSize: '32px', fontWeight: '800', color: '#1a202c',
  },

  layout: {
    display: 'flex', gap: '28px', maxWidth: '1100px',
    margin: '0 auto', alignItems: 'flex-start', flexWrap: 'wrap',
  },

  /* Form column */
  formCol: {
    flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '20px',
  },
  card: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },
  cardTitle: {
    margin: 0, fontSize: '17px', fontWeight: '800', color: '#1a202c',
  },
  row2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' },
  row3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' },

  /* Shipping options */
  shippingList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  shippingOption: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '14px 16px', borderRadius: '12px',
    border: '1.5px solid #e2e8f0', cursor: 'pointer',
    transition: 'border-color 0.15s ease',
  },
  shippingOptionActive: {
    borderColor: '#6366f1', backgroundColor: '#eef2ff',
  },
  shippingRadio: {
    width: '18px', height: '18px', borderRadius: '50%',
    border: '2px solid #6366f1', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  shippingRadioDot: {
    width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#6366f1',
  },
  shippingInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  shippingLabel: { fontSize: '14px', fontWeight: '700', color: '#1a202c' },
  shippingDays: { fontSize: '12px', color: '#718096' },
  shippingFee: { fontSize: '14px', fontWeight: '700', color: '#2d3748' },

  /* Summary column */
  summaryCol: { flex: '0 0 320px' },
  summaryBox: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: '12px',
    position: 'sticky', top: '24px',
  },
  summaryTitle: { margin: 0, fontSize: '18px', fontWeight: '800', color: '#1a202c' },

  productList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  productRow: { display: 'flex', alignItems: 'center', gap: '10px' },
  productThumb: { width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 },
  productMeta: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' },
  productName: { fontSize: '13px', fontWeight: '600', color: '#1a202c', lineHeight: '1.3' },
  productQty: { fontSize: '12px', color: '#718096' },
  productSubtotal: { fontSize: '14px', fontWeight: '700', color: '#2d3748', flexShrink: 0 },

  divider: { border: 'none', borderTop: '1px solid #e2e8f0', margin: '2px 0' },
  priceRow: {
    display: 'flex', justifyContent: 'space-between',
    fontSize: '14px', color: '#4a5568',
  },
  totalRow: { fontSize: '18px', fontWeight: '800', color: '#1a202c' },

  placeBtn: {
    marginTop: '8px', padding: '14px',
    fontSize: '15px', fontWeight: '700', color: '#fff',
    background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
    border: 'none', borderRadius: '12px', cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
  },
  backLink: {
    textAlign: 'center', color: '#6366f1', textDecoration: 'none',
    fontSize: '14px', fontWeight: '600',
  },

  /* Empty / Success */
  emptyBox: {
    maxWidth: '400px', margin: '120px auto 0', textAlign: 'center',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
  },
  emptyIcon: { fontSize: '56px' },
  emptyTitle: { fontSize: '24px', fontWeight: '800', color: '#1a202c', margin: 0 },
  emptySub: { fontSize: '15px', color: '#718096', margin: 0 },
  linkBtn: {
    marginTop: '8px', padding: '12px 32px', fontSize: '15px', fontWeight: '700',
    color: '#fff', background: 'linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)',
    borderRadius: '50px', textDecoration: 'none',
    boxShadow: '0 6px 20px rgba(99,102,241,0.35)',
  },
};
