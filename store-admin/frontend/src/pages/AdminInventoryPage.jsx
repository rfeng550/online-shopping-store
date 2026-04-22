// =============================================================================
// src/pages/AdminInventoryPage.jsx — Admin Inventory Table
// =============================================================================
//
// Fetches products from GET http://localhost:5001/api/products on mount.
// Shows a loading message while fetching, an error message if it fails,
// then displays the table with search / category / low-stock filters.
// =============================================================================

import { useState, useEffect } from 'react';

const API = 'http://localhost:5001';

export default function AdminInventoryPage() {
  // ── Fetch state ─────────────────────────────────────────────────────────────
  const [products, setProducts] = useState([]);   // all products from the API
  const [loading, setLoading]   = useState(true); // true while the request is in flight
  const [error, setError]       = useState(null); // string if something went wrong

  // ── Filter state ────────────────────────────────────────────────────────────
  const [search, setSearch]             = useState('');    // text search (name or id)
  const [category, setCategory]         = useState('all'); // category dropdown
  const [lowStockOnly, setLowStockOnly] = useState(false); // "Low stock only" checkbox

  // ── Fetch products when the component first appears on screen ───────────────
  // useEffect with an empty [] means "run this once, right after the first render"
  useEffect(() => {
    fetch(`${API}/api/products`)           // Step 1: send the GET request
      .then((res) => {
        if (!res.ok) {                     // Step 2: check HTTP status (e.g. 404, 500)
          throw new Error(`Server error: ${res.status}`);
        }
        return res.json();                 // Step 3: parse the JSON body
      })
      .then((data) => {
        setProducts(data);                 // Step 4: save products into state
        setLoading(false);                 // Step 5: hide the loading message
      })
      .catch((err) => {
        setError(err.message);             // if anything went wrong, save the error
        setLoading(false);                 // and stop showing "loading"
      });
  }, []); // <- empty array = run only once on mount

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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
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
};