import { NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

function Navbar() {
  const { cart } = useContext(CartContext);

  const navLinkClass = ({ isActive }) =>
    isActive ? 'nav-item active' : 'nav-item';

  return (
    <header>
      <nav>
        <NavLink to="/" className="nav-brand">
          <h2>PadelLP</h2>
        </NavLink>

        <div className="nav-links">
          <NavLink to="/" className={navLinkClass}>
            Inicio
          </NavLink>

          <NavLink to="/clubes" className={navLinkClass}>
            Clubes
          </NavLink>

          <NavLink to="/productos" className={navLinkClass}>
            Productos
          </NavLink>

          <NavLink to="/carrito" className={navLinkClass + ' cart-link'}>
            <span>Carrito</span>
            {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
          </NavLink>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;