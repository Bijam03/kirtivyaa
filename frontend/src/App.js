import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import Navbar  from './components/layout/Navbar';
import Footer  from './components/layout/Footer';

import HomePage          from './pages/HomePage';
import ProductsPage      from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage          from './pages/CartPage';
import CheckoutPage      from './pages/CheckoutPage';
import OrderDetailPage   from './pages/OrderDetailPage';
import OrderTrackPage    from './pages/OrderTrackPage';
import { MyOrdersPage }  from './pages/MyOrdersPage';
import AuthPage          from './pages/AuthPage';
import { AboutPage, ContactPage } from './pages/StaticPages';
import AdminPage         from './pages/admin/AdminPage';
import ProfilePage       from './pages/ProfilePage';

// ── Protected route: redirect to login, remember return URL ──
// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
};

// ── Redirect logged-in users away from auth page ─────────
const AuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      {/* Public */}
      <Route path="/"             element={<HomePage />} />
      <Route path="/products"     element={<ProductsPage />} />
      <Route path="/products/:id" element={<ProductDetailPage />} />
      <Route path="/about"        element={<AboutPage />} />
      <Route path="/contact"      element={<ContactPage />} />
      <Route path="/track"        element={<OrderTrackPage />} />

      {/* Auth (redirect away if logged in) */}
      <Route path="/login"    element={<AuthRoute><AuthPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><AuthPage defaultMode="register" /></AuthRoute>} />

      {/* Require login */}
      <Route path="/cart"     element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
      <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/orders"   element={<ProtectedRoute><MyOrdersPage /></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      {/* Admin only */}
      <Route path="/admin"    element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*"         element={<Navigate to="/" replace />} />
    </Routes>
    <Footer />
  </>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#3D1E0F',
              color: '#FDF6EC',
              fontFamily: "'Jost', sans-serif",
              fontSize: '13px',
              borderRadius: '12px',
              padding: '12px 18px',
              maxWidth: '360px',
            },
            success: { iconTheme: { primary: '#F0C97A', secondary: '#3D1E0F' } },
            error:   { iconTheme: { primary: '#F2B8C6', secondary: '#3D1E0F' } },
          }}
        />
        <AppRoutes />
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);

export default App;
