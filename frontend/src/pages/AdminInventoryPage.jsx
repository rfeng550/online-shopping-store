// =============================================================================
// src/pages/AdminInventoryPage.jsx — Admin Inventory Table
// =============================================================================
//
// Fetches products from GET ${import.meta.env.VITE_API_URL}/api/products on mount.
// Shows a loading message while fetching, an error message if it fails,
// then displays the table with search / category / low-stock filters.
// =============================================================================

import { useState, useEffect } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function AdminInventoryPage() {
  // ── Fetch state ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);   // all products from the API
  const [loading, setLoading]   = useState(true); // true while the request is in flight
  const [error, setError]       = useState(null); // string if something went wrong

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');    // text search (name or id)
  const [category, setCategory]         = useState('all'); // category dropdown
  const [lowStockOnly, setLowStockOnly] = useState(false); // "Low stock only" checkbox

  // ── Modal & Form state ──────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if creating
  const [formData, setFormData] = useState({
    name: '', price: '', category: '', stock: '', description: '', image: '', featured: false, on_sale: false
  });

  // ── Fetch helper ────────────────────────────────────────────────────────────
  const fetchProducts = () => {
    fetch(`${API}/api/products`)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []); // <- empty array = run only once on mount

  // ── CRUD Handlers ───────────────────────────────────────────────────────────
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name, price: product.price, category: product.category,
        stock: product.stock, description: product.description, image: product.image,
        featured: Boolean(product.featured), on_sale: Boolean(product.on_sale)
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', price: '', category: '', stock: '', description: '', image: '', featured: false, on_sale: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('No admin token found!');

    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `${API}/api/products/${editingProduct.id}` : `${API}/api/products`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10)
        })
      });
      if (!res.ok) throw new Error('Failed to save product');
      handleCloseModal();
      fetchProducts(); // refresh
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete product');
      fetchProducts(); // refresh
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Derive unique category list from the fetched products ───────────────────
  const categories = ['all', ...new Set(products.map((p) => p.category))];

  // ── Apply filters ───────────────────────────────────────────────────────────
  const filtered = products.filter((p) => {
    // 1. Text search: match name (case-insensitive) OR id (as string)
    const searchLower = search.toLowerCase();
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(searchLower) ||
      String(p.id).includes(searchLower);

    // 2. Category dropdown
    const matchesCategory = category === 'all' || p.category === category;

    // 3. Low stock checkbox (stock < 5)
    const matchesLowStock = !lowStockOnly || p.stock < 5;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={styles.header}>
        <h1 style={styles.heading}>Admin — Inventory</h1>
        <p style={styles.subheading}>
          Showing {filtered.length} of {products.length} products
        </p>
      </header>

      {/* ── Loading state ──────────────────────────────────────────────────── */}
      {loading && (
        <p style={styles.statusMsg}>Loading products…</p>
      )}

      {/* ── Error state ────────────────────────────────────────────────────── */}
      {error && (
        <p style={{ ...styles.statusMsg, color: '#c53030' }}>⚠ {error}</p>
      )}

      {/* ── Filters + table (only shown once data is ready) ────────────────── */}
      {!loading && !error && (
        <>
          {/* Filter bar */}
          <div style={styles.filterBar}>

            {/* Text search */}
            <input
              type="text"
              placeholder="Search by name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />

            {/* Category dropdown */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'all'
                    ? 'All Categories'
                    : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>

            {/* Low stock only checkbox */}
            <label style={styles.checkLabel}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
                style={{ marginRight: '6px' }}
              />
              Low stock only (stock &lt; 5)
            </label>

            {/* Add New Product Button */}
            <button style={styles.addBtn} onClick={() => handleOpenModal()}>
              + Add New Product
            </button>
          </div>

          {/* Table */}
          <div style={styles.tableWrapper}>
            {filtered.length === 0 ? (
              <p style={styles.empty}>No products match your filters.</p>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.theadRow}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Price</th>
                    <th style={styles.th}>Stock</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => {
                    const isLow = p.stock < 5;
                    return (
                      <tr
                        key={p.id}
                        style={{
                          backgroundColor: isLow
                            ? '#fff5f5'                           // light red for low stock
                            : i % 2 === 0 ? '#fff' : '#f9f9f9', // zebra stripe otherwise
                        }}
                      >
                        <td style={styles.td}>{p.id}</td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{p.name}</td>
                        <td style={styles.td}>
                          <span style={styles.catPill}>{p.category}</span>
                        </td>
                        <td style={styles.td}>${p.price.toFixed(2)}</td>
                        <td style={styles.td}>
                          {isLow ? (
                            <span style={styles.lowBadge}>⚠ {p.stock} LOW</span>
                          ) : (
                            <span style={{ color: '#38a169', fontWeight: '600' }}>{p.stock}</span>
                          )}
                        </td>
                        <td style={styles.td}>
                          <button style={styles.actionBtn} onClick={() => handleOpenModal(p)}>Edit</button>
                          <button style={{...styles.actionBtn, color: '#c53030'}} onClick={() => handleDelete(p.id)}>Delete</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Modal Form ──────────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSave} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Name *</label>
                <input required style={styles.input} type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Price *</label>
                  <input required style={styles.input} type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Stock *</label>
                  <input required style={styles.input} type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Category</label>
                  <input style={styles.input} type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Image URL</label>
                <input style={styles.input} type="text" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description</label>
                <textarea style={{...styles.input, minHeight: '80px'}} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>
              <div style={styles.formRow}>
                <label style={styles.checkLabel}>
                  <input type="checkbox" checked={formData.featured} onChange={e => setFormData({...formData, featured: e.target.checked})} style={{marginRight: '8px'}} />
                  Featured Product
                </label>
                <label style={styles.checkLabel}>
                  <input type="checkbox" checked={formData.on_sale} onChange={e => setFormData({...formData, on_sale: e.target.checked})} style={{marginRight: '8px'}} />
                  On Sale
                </label>
              </div>
              <div style={styles.modalActions}>
                <button type="button" onClick={handleCloseModal} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════════════════════════
const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f7f8fc',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    padding: '0 0 48px',
  },

  /* Header */
  header: {
    backgroundColor: '#1c1c1a',
    padding: '24px 32px',
    marginBottom: '24px',
  },
  heading: {
    margin: '0 0 4px',
    fontSize: '22px',
    fontWeight: '700',
    color: '#fff',
  },
  subheading: {
    margin: 0,
    fontSize: '13px',
    color: '#aaa',
  },

  /* Loading / error message */
  statusMsg: {
    textAlign: 'center',
    padding: '48px',
    fontSize: '15px',
    color: '#888',
  },

  /* Filter bar */
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '12px',
    padding: '0 32px',
    marginBottom: '20px',
  },
  searchInput: {
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    outline: 'none',
    minWidth: '220px',
    flex: '1',
    maxWidth: '320px',
  },
  select: {
    padding: '10px 14px',
    fontSize: '14px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    backgroundColor: '#fff',
    cursor: 'pointer',
    outline: 'none',
  },
  checkLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#2d3748',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    userSelect: 'none',
  },

  /* Table */
  tableWrapper: {
    margin: '0 32px',
    overflowX: 'auto',
    borderRadius: '10px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  theadRow: {
    backgroundColor: '#1c1c1a',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#2d3748',
    borderBottom: '1px solid #eee',
  },
  catPill: {
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    fontSize: '11px',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '20px',
    textTransform: 'capitalize',
  },

  /* Low stock badge */
  lowBadge: {
    backgroundColor: '#fff5f5',
    color: '#c53030',
    border: '1px solid #fed7d7',
    fontSize: '12px',
    fontWeight: '700',
    padding: '2px 8px',
    borderRadius: '20px',
  },

  /* Empty state */
  empty: {
    textAlign: 'center',
    padding: '48px',
    color: '#888',
    fontSize: '15px',
    backgroundColor: '#fff',
    borderRadius: '10px',
  },

  /* Action Buttons */
  addBtn: {
    marginLeft: 'auto',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: '#3182ce',
    fontWeight: '600',
    cursor: 'pointer',
    marginRight: '12px',
    fontSize: '13px',
  },

  /* Modal Form */
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  },
  modalTitle: {
    margin: '0 0 24px',
    fontSize: '20px',
    fontWeight: '700',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4a5568',
  },
  input: {
    padding: '10px',
    border: '1px solid #cbd5e0',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  cancelBtn: {
    padding: '10px 16px',
    backgroundColor: '#edf2f7',
    color: '#4a5568',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 16px',
    backgroundColor: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};