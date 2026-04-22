// =============================================================================
// src/pages/AdminPage.jsx — Admin Inventory Dashboard
// =============================================================================
//
// Three tabs:
//   1. All Products — table with stock +/−, Edit, Delete per row
//   2. Add Product  — form to create a new product (POST)
//   3. Edit Product — form pre-filled for a selected product (PUT)
//
// API base: http://localhost:5001
// =============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5001';

// Helper: read the JWT from localStorage and return it as an Authorization header.
// All endpoints protected by @require_role() on Flask need this header.
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
});

const CATEGORIES = ['laptops', 'tablets', 'audio', 'accessories'];

// Blank form state — used when opening the Add tab
const EMPTY_FORM = {
  name: '', price: '', image: '', category: 'accessories',
  stock: '', description: '', featured: false, on_sale: false,
};

export default function AdminPage() {
  // ── Tab state ──────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('list'); // 'list' | 'add' | 'edit'

  // ── Products list ──────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── Form (shared by Add and Edit) ──────────────────────────────────────────
  const [form, setForm]         = useState(EMPTY_FORM);
  const [editId, setEditId]     = useState(null);   // id of the product being edited
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState(null);   // success / error message after save

  // ── Fetch all products ─────────────────────────────────────────────────────
  const fetchProducts = () => {
    setLoading(true);
    setError(null);
    fetch(`${API}/api/products`)
      .then((res) => res.json())
      .then((data) => { setProducts(data); setLoading(false); })
      .catch(() => { setError('Could not load products. Is Flask running?'); setLoading(false); });
  };

  useEffect(() => { fetchProducts(); }, []);

  // ── Handle form field changes ──────────────────────────────────────────────
  const handleField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // ── Stock quick-update (+/−) ───────────────────────────────────────────────
  const handleStock = (product, delta) => {
    const newStock = Math.max(0, product.stock + delta);
    fetch(`${API}/api/products/${product.id}/stock`, {
      method: 'PATCH',
      headers: getAuthHeaders(),          // ← JWT required by Flask
      body: JSON.stringify({ stock: newStock }),
    })
      .then((res) => res.json())
      .then(() => {
        // Update locally so the UI reflects the change instantly
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
      });
  };

  // ── Open Edit tab pre-filled ───────────────────────────────────────────────
  const handleEditClick = (product) => {
    setEditId(product.id);
    setForm({
      name:        product.name,
      price:       product.price,
      image:       product.image || '',
      category:    product.category || 'accessories',
      stock:       product.stock,
      description: product.description || '',
      featured:    Boolean(product.featured),
      on_sale:     Boolean(product.on_sale),
    });
    setSaveMsg(null);
    setTab('edit');
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    fetch(`${API}/api/products/${product.id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),          // ← JWT required by Flask
    })
      .then(() => {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
      });
  };

  // ── Submit (Add or Edit) ───────────────────────────────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg(null);

    const payload = {
      name:        form.name.trim(),
      price:       parseFloat(form.price),
      image:       form.image.trim(),
      category:    form.category,
      stock:       parseInt(form.stock, 10) || 0,
      description: form.description.trim(),
      featured:    form.featured ? 1 : 0,
      on_sale:     form.on_sale  ? 1 : 0,
    };

    const isAdd   = tab === 'add';
    const url     = isAdd ? `${API}/api/products` : `${API}/api/products/${editId}`;
    const method  = isAdd ? 'POST' : 'PUT';

    fetch(url, {
      method,
      headers: getAuthHeaders(),          // ← JWT required by Flask
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        setSaving(false);
        if (data.error) {
          setSaveMsg({ type: 'error', text: data.error });
        } else {
          setSaveMsg({ type: 'success', text: isAdd ? `Product added (id ${data.id}).` : 'Product updated.' });
          fetchProducts();                     // refresh the table
          if (isAdd) setForm(EMPTY_FORM);      // clear form after add
        }
      })
      .catch(() => {
        setSaving(false);
        setSaveMsg({ type: 'error', text: 'Network error. Is Flask running?' });
      });
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Render
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div>
            <h1 style={styles.heading}>🔧 Admin — Inventory</h1>
            <p style={styles.subheading}>Manage products in the SQLite database</p>
          </div>
          <Link to="/" style={styles.homeLink}>← Back to Home</Link>
        </div>

        {/* Tab buttons */}
        <div style={styles.tabs}>
          {[
            { key: 'list', label: `All Products (${products.length})` },
            { key: 'add',  label: '+ Add Product' },
            { key: 'edit', label: '✏️ Edit Product', disabled: !editId },
          ].map(({ key, label, disabled }) => (
            <button
              key={key}
              style={{ ...styles.tab, ...(tab === key ? styles.tabActive : {}), ...(disabled ? styles.tabDisabled : {}) }}
              onClick={() => !disabled && setTab(key)}
              disabled={disabled}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <div style={styles.body}>

        {/* ════════════════════════════════════════
            TAB 1 — All Products Table
        ════════════════════════════════════════ */}
        {tab === 'list' && (
          <div>
            {loading && <p style={styles.msg}>Loading products…</p>}
            {error   && <p style={{ ...styles.msg, color: '#e53e3e' }}>⚠️ {error}</p>}

            {!loading && !error && (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.thead}>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Name</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Stock</th>
                      <th style={styles.th}>On Sale</th>
                      <th style={styles.th}>Featured</th>
                      <th style={styles.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.id} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                        <td style={styles.td}>{p.id}</td>
                        <td style={{ ...styles.td, fontWeight: '600', maxWidth: '200px' }}>{p.name}</td>
                        <td style={styles.td}>
                          <span style={styles.catPill}>{p.category}</span>
                        </td>
                        <td style={styles.td}>${p.price.toFixed(2)}</td>

                        {/* Stock with quick +/- controls */}
                        <td style={styles.td}>
                          <div style={styles.stockRow}>
                            <button style={styles.stockBtn} onClick={() => handleStock(p, -1)} disabled={p.stock === 0}>−</button>
                            <span style={{
                              ...styles.stockNum,
                              color: p.stock === 0 ? '#e53e3e' : p.stock < 10 ? '#dd6b20' : '#38a169',
                            }}>
                              {p.stock}
                            </span>
                            <button style={styles.stockBtn} onClick={() => handleStock(p, +1)}>+</button>
                          </div>
                        </td>

                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          {p.on_sale ? '✅' : '—'}
                        </td>
                        <td style={{ ...styles.td, textAlign: 'center' }}>
                          {p.featured ? '⭐' : '—'}
                        </td>

                        {/* Actions */}
                        <td style={{ ...styles.td, whiteSpace: 'nowrap' }}>
                          <button style={styles.editBtn} onClick={() => handleEditClick(p)}>Edit</button>
                          <button style={styles.deleteBtn} onClick={() => handleDelete(p)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB 2 & 3 — Add / Edit Form
        ════════════════════════════════════════ */}
        {(tab === 'add' || tab === 'edit') && (
          <div style={styles.formCard}>
            <h2 style={styles.formTitle}>
              {tab === 'add' ? '➕ Add New Product' : `✏️ Edit Product (id: ${editId})`}
            </h2>

            {/* Save message */}
            {saveMsg && (
              <p style={{
                ...styles.saveMsg,
                backgroundColor: saveMsg.type === 'success' ? '#f0fff4' : '#fff5f5',
                borderColor:     saveMsg.type === 'success' ? '#38a169' : '#e53e3e',
                color:           saveMsg.type === 'success' ? '#276749' : '#c53030',
              }}>
                {saveMsg.type === 'success' ? '✅ ' : '❌ '}{saveMsg.text}
              </p>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>

              {/* Row 1: Name + Price */}
              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>Name *</label>
                  <input style={styles.input} name="name" value={form.name} onChange={handleField} required placeholder="MacBook Pro 14-inch" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Price (USD) *</label>
                  <input style={styles.input} name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleField} required placeholder="999.99" />
                </div>
              </div>

              {/* Row 2: Category + Stock */}
              <div style={styles.row2}>
                <div style={styles.field}>
                  <label style={styles.label}>Category</label>
                  <select style={styles.input} name="category" value={form.category} onChange={handleField}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Stock</label>
                  <input style={styles.input} name="stock" type="number" min="0" step="1" value={form.stock} onChange={handleField} placeholder="0" />
                </div>
              </div>

              {/* Image URL full width */}
              <div style={styles.field}>
                <label style={styles.label}>Image URL</label>
                <input style={styles.input} name="image" value={form.image} onChange={handleField} placeholder="https://picsum.photos/seed/example/400/300" />
              </div>

              {/* Description full width */}
              <div style={styles.field}>
                <label style={styles.label}>Description</label>
                <textarea style={{ ...styles.input, height: '80px', resize: 'vertical' }} name="description" value={form.description} onChange={handleField} placeholder="Short product description…" />
              </div>

              {/* Checkboxes */}
              <div style={styles.checkRow}>
                <label style={styles.checkLabel}>
                  <input type="checkbox" name="on_sale" checked={form.on_sale} onChange={handleField} style={{ marginRight: '6px' }} />
                  On Sale
                </label>
                <label style={styles.checkLabel}>
                  <input type="checkbox" name="featured" checked={form.featured} onChange={handleField} style={{ marginRight: '6px' }} />
                  Featured
                </label>
              </div>

              {/* Submit */}
              <button type="submit" style={styles.submitBtn} disabled={saving}>
                {saving ? 'Saving…' : tab === 'add' ? 'Add Product' : 'Save Changes'}
              </button>

            </form>
          </div>
        )}

      </div>
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
  },

  /* Header */
  header: {
    backgroundColor: '#1c1c1a',
    padding: '24px 32px 0',
  },
  headerInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
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
  homeLink: {
    color: '#ccc',
    textDecoration: 'none',
    fontSize: '13px',
    marginTop: '4px',
  },

  /* Tabs */
  tabs: {
    display: 'flex',
    gap: '4px',
  },
  tab: {
    padding: '10px 20px',
    fontSize: '13px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '6px 6px 0 0',
    backgroundColor: '#333',
    color: '#aaa',
    cursor: 'pointer',
  },
  tabActive: {
    backgroundColor: '#f7f8fc',
    color: '#1c1c1a',
  },
  tabDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },

  /* Body */
  body: {
    padding: '28px 32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  msg: {
    textAlign: 'center',
    padding: '48px',
    color: '#888',
    fontSize: '15px',
  },

  /* Table */
  tableWrapper: {
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
  thead: {
    backgroundColor: '#1c1c1a',
  },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '700',
    color: '#ccc',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  td: {
    padding: '12px 14px',
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

  /* Stock controls */
  stockRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  stockBtn: {
    width: '26px',
    height: '26px',
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
    lineHeight: 1,
  },
  stockNum: {
    fontSize: '14px',
    fontWeight: '700',
    minWidth: '28px',
    textAlign: 'center',
  },

  /* Row action buttons */
  editBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#eef2ff',
    color: '#4338ca',
    border: '1px solid #c7d2fe',
    borderRadius: '6px',
    cursor: 'pointer',
    marginRight: '6px',
  },
  deleteBtn: {
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#fff5f5',
    color: '#c53030',
    border: '1px solid #fed7d7',
    borderRadius: '6px',
    cursor: 'pointer',
  },

  /* Form card */
  formCard: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
    maxWidth: '720px',
  },
  formTitle: {
    margin: '0 0 20px',
    fontSize: '18px',
    fontWeight: '700',
    color: '#1a202c',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#4a5568',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    color: '#1a202c',
    outline: 'none',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  checkRow: {
    display: 'flex',
    gap: '24px',
  },
  checkLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#2d3748',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '13px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#1c1c1a',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  saveMsg: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
  },
};
