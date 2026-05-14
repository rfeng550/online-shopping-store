import React from 'react';
import { Link } from 'react-router-dom';

// ─── Add new pages here ───────────────────────────────────────────────────────
const pages = [
  {
    path: '/products',
    title: '🛒 Tech Store',
    description: 'Browse 10 tech products with prices, stock info, and an Add to Cart button.',
    color: '#3182ce',
  },
  {
    path: '/cart',
    title: '🧺 Shopping Cart',
    description: 'View your cart, adjust quantities, and see your order total before checkout.',
    color: '#805ad5',
  },
  {
    path: '/checkout',
    title: '💳 Checkout',
    description: 'Enter your shipping address, choose a shipping method, and place your order.',
    color: '#d69e2e',
  },
  {
    path: '/admin',
    title: '🔧 Admin',
    description: 'Manage inventory: add, edit, update stock, and delete products.',
    color: '#2d8a4e',
  },
  {
    path: '/pos',
    title: '🧾 POS',
    description: 'Point of Sale system for cashiers to process in-store transactions.',
    color: '#e53e3e',
  },
  {
    path: '/orders',
    title: '📦 Order History',
    description: 'View your past orders, items purchased, and total amounts.',
    color: '#dd6b20',
  },
];
// ─────────────────────────────────────────────────────────────────────────────


export default function Home() {
  return (
    <div style={styles.page}>
      <header style={styles.hero}>
        <h1 style={styles.heroTitle}>My Pages</h1>
        <p style={styles.heroSub}>Click a card to navigate to that page.</p>
      </header>

      <main style={styles.grid}>
        {pages.map((p) => (
          <Link key={p.path} to={p.path} style={{ textDecoration: 'none' }}>
            <div
              style={{ ...styles.card, borderTop: `4px solid ${p.color}` }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h2 style={{ ...styles.cardTitle, color: p.color }}>{p.title}</h2>
              <p style={styles.cardDesc}>{p.description}</p>
              <span style={{ ...styles.cardLink, color: p.color }}>Visit →</span>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f7f8fc 0%, #eef2ff 100%)',
    fontFamily: "'Segoe UI', sans-serif",
    padding: '48px 24px',
  },
  hero: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '900',
    color: '#1a202c',
    margin: '0 0 12px',
    letterSpacing: '-1px',
  },
  heroSub: {
    fontSize: '18px',
    color: '#718096',
    margin: 0,
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    justifyContent: 'center',
    maxWidth: '900px',
    margin: '0 auto',
  },
  card: {
    width: '280px',
    backgroundColor: '#fff',
    borderRadius: '14px',
    padding: '28px 24px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '20px',
    fontWeight: '700',
  },
  cardDesc: {
    margin: 0,
    fontSize: '14px',
    color: '#718096',
    lineHeight: '1.5',
    flexGrow: 1,
  },
  cardLink: {
    fontSize: '14px',
    fontWeight: '700',
    marginTop: '8px',
  },
};
