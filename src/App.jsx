import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

import Home from './pages/Home';
import Clubs from './pages/Clubs';
import Courts from './pages/Courts';
import CourtDetail from './pages/CourtDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminReservations from './pages/AdminReservations';
import AdminLogin from './pages/AdminLogin';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';

function Layout() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Navbar />}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/clubes" element={<Clubs />} />
          <Route path="/club/:id" element={<Courts />} />
          <Route path="/cancha/:id" element={<CourtDetail />} />
          <Route path="/productos" element={<Products />} />
          <Route path="/producto/:id" element={<ProductDetail />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminReservations />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>

      {!isAdminPage && <Footer />}
    </>
  );
}

function App() {
  return <Layout />;
}

export default App;