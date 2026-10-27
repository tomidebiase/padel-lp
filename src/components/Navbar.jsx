
import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

import './Navbar.css';

function Navbar() {
  const { cart } = useContext(CartContext);

  const cartCount = cart.length;

  const navLinkClass = ({ isActive }) =>
    `nav-item ${isActive ? 'active' : ''}`;

  return (
    <header className="pl-navbar-header">
      <nav
        className="pl-navbar"
        aria-label="Navegación principal"
      >
        <NavLink
          to="/"
          className="nav-brand pl-navbar-brand"
          aria-label="PadelLP - Inicio"
        >
          <h2>PadelLP</h2>
        </NavLink>

        <div className="pl-navbar-links">
          <NavLink
            to="/"
            end
            className={navLinkClass}
          >
            Inicio
          </NavLink>

          <NavLink
            to="/clubes"
            className={navLinkClass}
          >
            Clubes
          </NavLink>

          <NavLink
            to="/productos"
            className={navLinkClass}
          >
            Productos
          </NavLink>
        </div>

        <NavLink
          to="/carrito"
          className={({ isActive }) =>
            `pl-navbar-cart ${isActive ? 'active' : ''}`
          }
          aria-label={
            `Carrito, ${cartCount} ${
              cartCount === 1 ? 'artículo' : 'artículos'
            }`
          }
          title="Ver carrito"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.5 13h12l3-9H6" />
          </svg>

          {cartCount > 0 && (
            <span
              className="pl-navbar-cart-badge"
              aria-hidden="true"
            >
              {cartCount}
            </span>
          )}
        </NavLink>
      </nav>
    </header>
  );
}

export default Navbar;
