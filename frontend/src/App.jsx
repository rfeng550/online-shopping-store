import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductStorePage from './pages/ProductStorePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import POSPage from './pages/POSPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { CartProvider } from './context/CartContext.jsx';

// -----------------------------------------------------------------------------
// Global Navigation — shows on every page EXCEPT the home page
// -----------------------------------------------------------------------------
function GlobalNav() {
  const location = useLocation();
  if (location.pathname === '/') return null;

  return (
    <nav style={navStyle}>
      <div style={navInner}>
        <span style={navBrand}>🛒 Store</span>
        <div style={navLinks}>
          <Link to="/" style={linkStyle}>Home</Link>
          <Link to="/products" style={linkStyle}>Shop</Link>
          <Link to="/cart" style={linkStyle}>Cart</Link>
          <Link to="/orders" style={linkStyle}>Orders</Link>
          <span style={navSeparator}>|</span>
          <Link to="/pos" style={linkStyle}>POS</Link>
          <Link to="/admin" style={linkStyle}>Admin</Link>
        </div>
      </div>
    </nav>
  );
}

const navStyle = {
  backgroundColor: '#1e293b',
  padding: '12px 24px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 999,
};

const navInner = {
  maxWidth: '1200px',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '32px',
};

const navBrand = {
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '18px',
  letterSpacing: '0.5px',
};

const navLinks = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const linkStyle = {
  color: '#cbd5e1',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  padding: '4px 8px',
  borderRadius: '4px',
  transition: 'all 0.2s',
};

const navSeparator = {
  color: '#475569',
  margin: '0 8px',
};

// -----------------------------------------------------------------------------
// LogoutButton — shown on every page so the user can always sign out
// -----------------------------------------------------------------------------
function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear the JWT and role saved during login
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  // Only show the button if the user is currently logged in
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  if (!isLoggedIn) return null;

  return (
    <button onClick={handleLogout} style={logoutStyle}>
      Logout
    </button>
  );
}

const logoutStyle = {
  position: 'fixed',
  top: '14px',
  right: '18px',
  zIndex: 1000,
  padding: '8px 18px',
  backgroundColor: '#e53935',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '14px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
};

// -----------------------------------------------------------------------------
// App — router + routes
// -----------------------------------------------------------------------------
export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <GlobalNav />
        <LogoutButton />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/products"      element={<ProductStorePage />} />
          <Route path="/products/:id"  element={<ProductDetailPage />} />
          <Route path="/cart"          element={<CartPage />} />
          <Route path="/checkout"      element={<CheckoutPage />} />
          <Route path="/admin"         element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/pos"           element={
            <ProtectedRoute requiredRoles={["admin", "cashier"]}>
              <POSPage />
            </ProtectedRoute>
          } />
          <Route path="/orders"        element={<OrderHistoryPage />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

