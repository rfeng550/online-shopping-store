import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import Home from './pages/Home.jsx';
import ProductStorePage from './pages/ProductStorePage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { CartProvider } from './context/CartContext.jsx';

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
        <LogoutButton />
        <Routes>
          <Route path="/"              element={<Home />} />
          <Route path="/login"         element={<LoginPage />} />
          <Route path="/products"      element={<ProductStorePage />} />
          <Route path="/products/:id"  element={<ProductDetailPage />} />
          <Route path="/cart"          element={<CartPage />} />
          <Route path="/checkout"      element={<CheckoutPage />} />
          <Route path="/admin"         element={
            <ProtectedRoute requiredRole="admin">
              <AdminPage />
            </ProtectedRoute>
          } />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

