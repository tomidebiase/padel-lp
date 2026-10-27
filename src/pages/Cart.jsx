
import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

import './Cart.css';

function formatPrice(value) {
  return Number(value || 0).toLocaleString('es-AR');
}

function Cart() {
  const navigate = useNavigate();

  const {
    cart,
    cartCount,
    clearCart,
    removeReservationFromCart,
    removeProductFromCart,
    updateProductQuantity,
    getProductsTotal,
  } = useContext(CartContext);

  const productItems = cart.filter(
    (item) => item.type === 'product'
  );

  const reservationItems = cart.filter(
    (item) => item.type === 'reservation'
  );

  const productsTotal = getProductsTotal();

  const reservationsTotal = reservationItems.reduce(
    (total, item) => total + Number(item.price || 0),
    0
  );

  const grandTotal = productsTotal + reservationsTotal;

  const productCount = productItems.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );

  const hasMixedItems =
    productItems.length > 0 && reservationItems.length > 0;

  const goToDemoCheckout = () => {
    const firstReservation = reservationItems[0];

    navigate('/checkout', {
      state: firstReservation
        ? { clubId: String(firstReservation.clubId) }
        : {},
    });
  };

  return (
    <section className="pl-cart-page">
      {/* NAVEGACIÓN */}
      <div className="pl-cart-breadcrumb">
        <Link to="/">Inicio</Link>
        <span>/</span>
        <span>Mi carrito</span>
      </div>

      {/* ENCABEZADO COMPACTO */}
      <div
        className="pl-cart-heading"
        style={{ marginTop: '14px', marginBottom: '26px' }}
      >
        <div>
          <span className="pl-cart-section-label">
            PADELLP / TU SELECCIÓN
          </span>

          <h2>Mi carrito.</h2>

          <p>
            {cart.length === 0
              ? 'Todavía no agregaste productos a tu carrito.'
              : `${cartCount} ${
                  cartCount === 1
                    ? 'artículo en tu carrito'
                    : 'artículos en tu carrito'
                }`}
          </p>
        </div>

        {cart.length > 0 && (
          <button
            type="button"
            className="pl-cart-clear"
            onClick={clearCart}
          >
            Vaciar carrito
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        /* CARRITO VACÍO */
        <div
          className="pl-cart-empty"
          style={{
            marginTop: 0,
            padding: '45px 24px',
          }}
        >
          <div
            className="pl-cart-empty-icon"
            aria-hidden="true"
          >
            ◇
          </div>

          <h2>Tu carrito está vacío.</h2>

          <p>
            Explorá nuestra selección de paletas,
            pelotas y accesorios para encontrar
            tu próximo favorito.
          </p>

          <div className="pl-cart-empty-actions">
            <Link
              to="/productos"
              className="pl-cart-main-button"
            >
              Explorar productos
              <span aria-hidden="true">↗</span>
            </Link>

            <Link
              to="/clubes"
              className="pl-cart-outline-button"
            >
              Ver clubes
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      ) : (
        /* CARRITO CON ARTÍCULOS */
        <div className="pl-cart-layout">
          <div className="pl-cart-items-column">
            {/* PRODUCTOS */}
            {productItems.length > 0 && (
              <div className="pl-cart-items-panel">
                <div className="pl-cart-panel-header">
                  <div>
                    <span className="pl-cart-panel-overline">
                      EQUIPAMIENTO
                    </span>

                    <h3>Productos</h3>
                  </div>

                  <span className="pl-cart-panel-count">
                    {productCount}{' '}
                    {productCount === 1
                      ? 'unidad'
                      : 'unidades'}
                  </span>
                </div>

                <div className="pl-cart-products">
                  {productItems.map((product) => {
                    const quantity = Number(
                      product.quantity || 1
                    );

                    const stock = Number(
                      product.stock || 0
                    );

                    const subtotal =
                      Number(product.price || 0) *
                      quantity;

                    return (
                      <article
                        className="pl-cart-product"
                        key={product.id}
                      >
                        <Link
                          to={`/producto/${product.id}`}
                          className="pl-cart-product-image"
                          aria-label={`Ver ${product.name}`}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                            />
                          ) : (
                            <span aria-hidden="true">
                              ◇
                            </span>
                          )}
                        </Link>

                        <div className="pl-cart-product-body">
                          <div className="pl-cart-product-top">
                            <div>
                              <span className="pl-cart-product-brand">
                                {product.brand || 'PADELLP'}
                              </span>

                              <h4>
                                <Link
                                  to={`/producto/${product.id}`}
                                >
                                  {product.name}
                                </Link>
                              </h4>
                            </div>

                            <button
                              type="button"
                              className="pl-cart-remove"
                              onClick={() =>
                                removeProductFromCart(
                                  product.id
                                )
                              }
                              aria-label={`Quitar ${product.name} del carrito`}
                            >
                              Quitar
                            </button>
                          </div>

                          <p className="pl-cart-unit-price">
                            Precio unitario: $
                            {formatPrice(product.price)}
                          </p>

                          <div className="pl-cart-product-bottom">
                            <div className="pl-cart-quantity">
                              <button
                                type="button"
                                onClick={() =>
                                  updateProductQuantity(
                                    product.id,
                                    quantity - 1
                                  )
                                }
                                disabled={quantity <= 1}
                                aria-label={`Disminuir cantidad de ${product.name}`}
                              >
                                −
                              </button>

                              <span>{quantity}</span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateProductQuantity(
                                    product.id,
                                    quantity + 1
                                  )
                                }
                                disabled={
                                  stock > 0 &&
                                  quantity >= stock
                                }
                                aria-label={`Aumentar cantidad de ${product.name}`}
                              >
                                +
                              </button>
                            </div>

                            <div className="pl-cart-product-subtotal">
                              <span>SUBTOTAL</span>

                              <strong>
                                ${formatPrice(subtotal)}
                              </strong>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RESERVAS ANTIGUAS EN EL CARRITO */}
            {reservationItems.length > 0 && (
              <div className="pl-cart-items-panel">
                <div className="pl-cart-panel-header">
                  <div>
                    <span className="pl-cart-panel-overline">
                      CANCHAS
                    </span>

                    <h3>Turnos guardados</h3>
                  </div>

                  <span className="pl-cart-panel-count">
                    {reservationItems.length}{' '}
                    {reservationItems.length === 1
                      ? 'turno'
                      : 'turnos'}
                  </span>
                </div>

                <div className="pl-cart-reservations">
                  {reservationItems.map(
                    (reservation, index) => (
                      <article
                        className="pl-cart-reservation"
                        key={
                          reservation.reservationId ||
                          `${reservation.courtId}-${reservation.date}-${reservation.schedule}-${index}`
                        }
                      >
                        <div className="pl-cart-reservation-icon">
                          ◫
                        </div>

                        <div className="pl-cart-reservation-info">
                          <span className="pl-cart-product-brand">
                            {reservation.clubName}
                          </span>

                          <h4>
                            {reservation.courtName ||
                              reservation.name ||
                              'Cancha'}
                          </h4>

                          <p>
                            {reservation.date || 'Sin fecha'}
                            {' · '}
                            {reservation.schedule ||
                              'Sin horario'}
                          </p>

                          <span className="pl-cart-reservation-notice">
                            Reserva no confirmada · Demo
                          </span>
                        </div>

                        <div className="pl-cart-reservation-side">
                          <strong>
                            $
                            {formatPrice(
                              reservation.price
                            )}
                          </strong>

                          <button
                            type="button"
                            className="pl-cart-remove"
                            onClick={() =>
                              removeReservationFromCart(
                                reservation.reservationId
                              )
                            }
                          >
                            Quitar
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>
              </div>
            )}

            {hasMixedItems && (
              <div className="pl-cart-info-box">
                <span aria-hidden="true">i</span>

                <p>
                  Tenés productos y turnos guardados
                  en el mismo carrito. Esta versión
                  es demostrativa: no se procesan
                  compras ni reservas reales.
                </p>
              </div>
            )}

            <Link
              to="/productos"
              className="pl-cart-continue"
            >
              ← Seguir explorando productos
            </Link>
          </div>

          {/* RESUMEN DE COMPRA */}
          <aside className="pl-cart-summary">
            <div className="pl-cart-summary-card">
              <span className="pl-cart-section-label">
                TU COMPRA
              </span>

              <h3>Resumen del carrito</h3>

              {productItems.length > 0 && (
                <div className="pl-cart-summary-row">
                  <span>Productos</span>

                  <strong>
                    ${formatPrice(productsTotal)}
                  </strong>
                </div>
              )}

              {reservationItems.length > 0 && (
                <div className="pl-cart-summary-row">
                  <span>Turnos guardados</span>

                  <strong>
                    ${formatPrice(reservationsTotal)}
                  </strong>
                </div>
              )}

              <div className="pl-cart-summary-row">
                <span>Artículos</span>

                <strong>{cartCount}</strong>
              </div>

              <div className="pl-cart-summary-divider" />

              <div className="pl-cart-summary-total">
                <span>TOTAL DE REFERENCIA</span>

                <strong>
                  ${formatPrice(grandTotal)}
                </strong>
              </div>

              <button
                type="button"
                className="pl-cart-checkout-button"
                onClick={goToDemoCheckout}
              >
                Ver checkout demo
                <span aria-hidden="true">↗</span>
              </button>

              <p className="pl-cart-checkout-note">
                Carrito de demostración. No se realizan
                cobros, compras ni reservas reales.
              </p>
            </div>

            <div className="pl-cart-side-banner">
              <span>PADELLP EXPERIENCE</span>

              <h3>Que empiece el partido.</h3>

              <p>
                Descubrí más clubes y canchas
                de pádel en la plataforma.
              </p>

              <Link to="/clubes">
                Explorar clubes ↗
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* BANNER SECUNDARIO AL FINAL */}
      <div
        className="pl-cart-side-banner"
        style={{
          marginTop: '30px',
          padding: '30px',
        }}
      >
        <span>YOUR GAME · YOUR GEAR</span>

        <h3>Todo empieza con un buen partido.</h3>

        <p>
          Seguí explorando PadelLP y descubrí
          los clubes, las canchas y el equipamiento.
        </p>

        <Link to="/clubes">
          Descubrir clubes ↗
        </Link>
      </div>
    </section>
  );
}

export default Cart;
