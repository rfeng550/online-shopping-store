import React, { useState, useEffect } from 'react';

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [posCart, setPosCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch products
  const fetchProducts = () => {
    setLoading(true);
    fetch(`${API_URL}/api/products`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search
  const filteredProducts = Array.isArray(products) 
    ? products.filter((p) => (p.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()))
    : [];

  // Cart operations
  const addToCart = (product) => {
    if (product.stock === 0) return;
    
    setPosCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, delta) => {
    setPosCart((prev) => {
      return prev.map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null; // We will filter nulls out
          // Optional: cap at actual stock
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean);
    });
  };

  const clearCart = () => setPosCart([]);

  const subtotal = posCart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100;
  const taxableAmount = subtotal - discountAmount;
  const tax = taxableAmount * 0.08;
  const total = taxableAmount + tax;

  const handleCheckout = async () => {
    setCheckoutError('');
    setSuccessMsg('');

    if (posCart.length === 0) return;

    const token = localStorage.getItem('token');
    
    // Prepare payload
    const items = posCart.map(item => ({ id: item.id, quantity: item.quantity }));

    try {
      const res = await fetch(`${API_URL}/api/pos/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          items,
          discount_percent: Number(discountPercent) || 0 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setCheckoutError(data.error || 'Failed to checkout');
        return;
      }

      setSuccessMsg(`Sale complete! Order ID: ${data.order_id}`);
      clearCart();
      fetchProducts(); // Refresh stock
      
      setTimeout(() => setSuccessMsg(''), 4000);

    } catch (err) {
      setCheckoutError('Network error during checkout');
    }
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>Point of Sale</h1>
        <div style={styles.headerRight}>
          <span style={styles.roleBadge}>Cashier/Admin</span>
        </div>
      </header>

      <div style={styles.container}>
        
        {/* Left: Product Catalog */}
        <div style={styles.catalogCol}>
          <div style={styles.searchBar}>
            <input 
              style={styles.searchInput}
              type="text" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div style={styles.grid}>
            {loading ? (
              <p>Loading products...</p>
            ) : filteredProducts.length === 0 ? (
              <p>No products found.</p>
            ) : (
              filteredProducts.map((p) => (
                <div 
                  key={p.id} 
                  style={{...styles.card, opacity: p.stock === 0 ? 0.6 : 1}}
                  onClick={() => addToCart(p)}
                >
                  <div style={styles.cardImgWrapper}>
                    <img src={p.image} alt={p.name} style={styles.cardImg} />
                    {p.stock === 0 && <span style={styles.outOfStock}>Empty</span>}
                  </div>
                  <div style={styles.cardInfo}>
                    <div style={styles.cardName}>{p.name}</div>
                    <div style={styles.cardPriceRow}>
                      <span style={styles.cardPrice}>${p.price.toFixed(2)}</span>
                      <span style={styles.cardStock}>Stock: {p.stock}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Cart & Checkout */}
        <div style={styles.cartCol}>
          <div style={styles.cartBox}>
            <h2 style={styles.cartTitle}>Current Sale</h2>
            
            <div style={styles.cartItemsList}>
              {posCart.length === 0 ? (
                <p style={styles.emptyCartMsg}>Cart is empty</p>
              ) : (
                posCart.map(item => (
                  <div key={item.id} style={styles.cartItem}>
                    <div style={styles.cartItemInfo}>
                      <div style={styles.cartItemName}>{item.name}</div>
                      <div style={styles.cartItemPrice}>${item.price.toFixed(2)} x {item.quantity}</div>
                    </div>
                    
                    <div style={styles.qtyControls}>
                      <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>−</button>
                      <span style={styles.qtyLabel}>{item.quantity}</span>
                      <button style={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                    
                    <div style={styles.cartItemTotal}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <hr style={styles.divider} />
            
            <div style={styles.totals}>
              <div style={styles.totalRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div style={styles.totalRow}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Discount (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    style={styles.discountInput}
                  />
                </span>
                <span style={{ color: '#ef4444' }}>
                  −${discountAmount.toFixed(2)}
                </span>
              </div>
              <div style={styles.totalRow}>
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div style={{...styles.totalRow, ...styles.grandTotal}}>
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {checkoutError && <div style={styles.errorMsg}>{checkoutError}</div>}
            {successMsg && <div style={styles.successMsg}>{successMsg}</div>}

            <div style={styles.actionBtns}>
              <button style={styles.clearBtn} onClick={clearCart} disabled={posCart.length === 0}>
                Clear
              </button>
              <button 
                style={styles.checkoutBtn} 
                onClick={handleCheckout} 
                disabled={posCart.length === 0}
              >
                Complete Sale
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f1f5f9',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#1e293b',
    color: '#fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  headerTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  roleBadge: {
    backgroundColor: '#475569',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  container: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  
  /* Left Catalog */
  catalogCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e2e8f0',
  },
  searchBar: {
    padding: '16px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #e2e8f0',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  grid: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gridAutoRows: 'min-content',
    gap: '16px',
    alignContent: 'start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    transition: 'transform 0.1s, box-shadow 0.1s',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '210px',
  },
  cardImgWrapper: {
    height: '130px',
    flexShrink: 0,
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  cardImg: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  outOfStock: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontWeight: 'bold',
    fontSize: '12px',
  },
  cardInfo: {
    padding: '12px',
  },
  cardName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '8px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cardPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPrice: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#059669',
  },
  cardStock: {
    fontSize: '12px',
    color: '#64748b',
  },

  /* Right Cart */
  cartCol: {
    width: '400px',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
  },
  cartBox: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px',
  },
  cartTitle: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: '800',
    color: '#1e293b',
  },
  cartItemsList: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    paddingRight: '8px',
  },
  emptyCartMsg: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '40px',
    fontStyle: 'italic',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  cartItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  cartItemName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  cartItemPrice: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 12px',
  },
  qtyBtn: {
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#334155',
    fontWeight: 'bold',
  },
  qtyLabel: {
    fontSize: '14px',
    fontWeight: '600',
    width: '16px',
    textAlign: 'center',
  },
  cartItemTotal: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    width: '60px',
    textAlign: 'right',
  },

  divider: {
    border: 'none',
    borderTop: '1px dashed #cbd5e1',
    margin: '20px 0',
  },

  totals: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    color: '#475569',
  },
  discountInput: {
    width: '50px',
    padding: '4px 8px',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '14px',
    textAlign: 'right',
  },
  grandTotal: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    marginTop: '8px',
  },

  errorMsg: {
    color: '#ef4444',
    fontSize: '13px',
    textAlign: 'center',
    marginBottom: '12px',
    fontWeight: '600',
  },
  successMsg: {
    color: '#059669',
    fontSize: '13px',
    textAlign: 'center',
    marginBottom: '12px',
    fontWeight: '600',
    backgroundColor: '#d1fae5',
    padding: '8px',
    borderRadius: '6px',
  },

  actionBtns: {
    display: 'flex',
    gap: '12px',
  },
  clearBtn: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#fff',
    border: '1px solid #cbd5e1',
    color: '#475569',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  checkoutBtn: {
    flex: 2,
    padding: '14px',
    backgroundColor: '#2563eb',
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};
