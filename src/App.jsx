import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { trackPageView } from './lib/analytics';
import CartDrawer from './components/layout/CartDrawer';
import Toaster from './components/ui/Toaster';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Confirmation from './pages/Confirmation';
import OrderTracking from './pages/OrderTracking';
import Wishlist from './pages/Wishlist';
import Offers from './pages/Offers';
import AdminLogin from './pages/admin/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/Orders';
import AdminCoupons from './pages/admin/Coupons';
import AdminConfig from './pages/admin/Config';
import AdminReviews from './pages/admin/Reviews';
import useAuthStore from './store/authStore';
import InstallBanner from './components/ui/InstallBanner';
import PromoBanner from './components/ui/PromoBanner';

function StorefrontLayout({ children }) {
  return (
    <>
      <PromoBanner />
      <Navbar />
      <CartDrawer />
      {children}
      <Footer />
    </>
  );
}

function PageTracker() {
  const location = useLocation();
  useEffect(() => { trackPageView(location.pathname + location.search); }, [location]);
  return null;
}

function RequireAuth({ children }) {
  const token = useAuthStore((s) => s.token);
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster />
      <InstallBanner />
      <PageTracker />
      <Routes>
        {/* Public storefront */}
        <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
        <Route path="/producto/:slug" element={<StorefrontLayout><ProductDetail /></StorefrontLayout>} />
        <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
        <Route path="/confirmacion" element={<StorefrontLayout><Confirmation /></StorefrontLayout>} />
        <Route path="/favoritos" element={<StorefrontLayout><Wishlist /></StorefrontLayout>} />
        <Route path="/ofertas" element={<StorefrontLayout><Offers /></StorefrontLayout>} />
        <Route path="/pedido" element={<StorefrontLayout><OrderTracking /></StorefrontLayout>} />
        <Route path="/pedido/:number" element={<StorefrontLayout><OrderTracking /></StorefrontLayout>} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAuth><AdminDashboard /></RequireAuth>}>
          <Route path="productos"              element={<AdminProducts />} />
          <Route path="productos/nuevo"        element={<AdminProductForm />} />
          <Route path="productos/:id/editar"   element={<AdminProductForm />} />
          <Route path="ordenes"                element={<AdminOrders />} />
          <Route path="cupones"                element={<AdminCoupons />} />
          <Route path="resenas"                element={<AdminReviews />} />
          <Route path="config"                 element={<AdminConfig />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
