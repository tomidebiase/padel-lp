
import {
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';

import Home from './pages/Home';
import Clubs from './pages/Clubs';
import Courts from './pages/Courts';
import CourtDetail from './pages/CourtDetail';
import Cart from './pages/Cart';
import AdminReservations from './pages/AdminReservations';
import AdminLogin from './pages/AdminLogin';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';

// Modo demostración para el portfolio.
// La gestión de reservas y pagos reales
// se habilitará al completar el backend.
const DEMO_MODE = true;

function DemoCheckout() {
  return (
    <section className="checkout-page">
      <div
        className="checkout-card"
        style={{ maxWidth: '750px', margin: '0 auto' }}
      >
        <div className="checkout-form-header">
          <h1>Checkout en desarrollo</h1>

          <p>
            Estás explorando la demostración de PadelLP.
          </p>
        </div>

        <div
          className="checkout-form-card"
          style={{ lineHeight: 1.7 }}
        >
          <h2>¡Gracias por explorar el proyecto!</h2>

          <p>
            El catálogo, el carrito y el panel administrativo
            forman parte de esta aplicación desarrollada
            con React y Firebase.
          </p>

          <p>
            Las reservas y los pagos reales están
            temporalmente deshabilitados mientras
            se completa su integración segura.
          </p>

          <p>
            Podés seguir recorriendo los clubes
            y los productos de la plataforma.
          </p>

          <div
            className="detail-actions"
            style={{ marginTop: '20px' }}
          >
            <Link
              to="/clubes"
              className="primary-button"
            >
              Explorar clubes
            </Link>

            <Link
              to="/productos"
              className="secondary-button"
            >
              Ver productos
            </Link>

            <Link
              to="/carrito"
              className="secondary-button"
            >
              Volver al carrito
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Layout() {
  const location = useLocation();

  const isAdminPage =
    location.pathname.startsWith('/admin');

  return (
    <>
      {!isAdminPage && <Navbar />}

      {!isAdminPage && DEMO_MODE && (
        <div
          role="status"
          style={{
            background: '#eff6ff',
            color: '#1e40af',
            padding: '12px 20px',
            textAlign: 'center',
            fontSize: '14px',
            borderBottom: '1px solid #bfdbfe',
          }}
        >
          <strong>PadelLP · Demo de portfolio</strong>
          {' — '}
          Explorá la plataforma. Reservas y pagos
          reales todavía no están habilitados.
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/clubes"
            element={<Clubs />}
          />

          <Route
            path="/club/:id"
            element={<Courts />}
          />

          <Route
            path="/cancha/:id"
            element={<CourtDetail />}
          />

          <Route
            path="/productos"
            element={<Products />}
          />

          <Route
            path="/producto/:id"
            element={<ProductDetail />}
          />

          <Route
            path="/carrito"
            element={<Cart />}
          />

          <Route
            path="/checkout"
            element={<DemoCheckout />}
          />

          <Route
            path="/admin-login"
            element={<AdminLogin />}
          />

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
