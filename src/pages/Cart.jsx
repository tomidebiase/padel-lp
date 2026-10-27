
import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';

function Cart() {
  const navigate = useNavigate();
  const [checkoutError, setCheckoutError] = useState('');

  const {
    cart,
    clearCart,
    removeReservationFromCart,
    removeProductFromCart,
    updateProductQuantity,
    getProductsTotal,
  } = useContext(CartContext);

  const reservationItems = cart.filter(
    (item) => item.type === 'reservation'
  );

  const productItems = cart.filter(
    (item) => item.type === 'product'
  );

  const reservationsTotal = reservationItems.reduce(
    (acc, item) => acc + Number(item.price || 0),
    0
  );

  const productsTotal = getProductsTotal();
  const total = reservationsTotal + productsTotal;

  // Identificamos los clubes que tienen reservas en el carrito.
  const reservationClubs = Array.from(
    new Map(
      reservationItems.map((item) => [
        String(item.clubId),
        {
          clubId: String(item.clubId),
          clubName: item.clubName,
        },
      ])
    ).values()
  );

  const hasMixedCart =
    productItems.length > 0 && reservationItems.length > 0;

  const handleProductCheckout = () => {
    setCheckoutError('');

    if (reservationItems.length > 0) {
      setCheckoutError(
        'Por ahora, los productos y las reservas se procesan por separado. ' +
        'Vamos a mejorar este flujo antes de habilitar compras mixtas.'
      );
      return;
    }

    navigate('/checkout');
  };

  const handleReservationCheckout = (clubId) => {
    setCheckoutError('');

    if (productItems.length > 0) {
      setCheckoutError(
        'Hay productos y reservas en el mismo carrito. ' +
        'El checkout actual todavía no admite procesarlos juntos. ' +
        'Vamos a corregir ese caso en el siguiente paso.'
      );
      return;
    }

    navigate('/checkout', {
      state: {
        clubId: String(clubId),
      },
    });
  };

  const handleClearCart = () => {
    clearCart();
    setCheckoutError('');
  };

  return (
    <section>
      <h1>Carrito</h1>

      {cart.length === 0 ? (
        <div className="checkout-form-card">
          <p>Tu carrito está vacío.</p>

          <div className="detail-actions">
            <button
              className="secondary-button"
              onClick={() => navigate('/')}
            >
              Ir al inicio
            </button>
          </div>
        </div>
      ) : (
        <>
          {productItems.length > 0 && (
            <div
              className="checkout-form-card"
              style={{ marginBottom: '1rem' }}
            >
              <h2>Productos</h2>

              <div className="cart-list">
                {productItems.map((product) => (
                  <article
                    className="cart-item"
                    key={product.id}
                  >
                    <h3>{product.name}</h3>

                    <p>Marca: {product.brand}</p>

                    <p>
                      Precio: $
                      {Number(product.price).toLocaleString('es-AR')}
                    </p>

                    <p>Cantidad: {product.quantity}</p>

                    <p>
                      Subtotal: $
                      {Number(
                        product.price * product.quantity
                      ).toLocaleString('es-AR')}
                    </p>

                    <div className="detail-actions">
                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateProductQuantity(
                            product.id,
                            product.quantity - 1
                          )
                        }
                      >
                        -
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          updateProductQuantity(
                            product.id,
                            product.quantity + 1
                          )
                        }
                      >
                        +
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() =>
                          removeProductFromCart(product.id)
                        }
                      >
                        Quitar producto
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {reservationItems.length > 0 && (
            <div
              className="checkout-form-card"
              style={{ marginBottom: '1rem' }}
            >
              <h2>Reservas</h2>

              <div className="cart-list">
                {reservationItems.map((court) => (
                  <article
                    className="cart-item"
                    key={court.reservationId}
                  >
                    <h3>{court.name}</h3>

                    <p>Club: {court.clubName}</p>

                    <p>Día: {court.date}</p>

                    <p>Horario: {court.schedule}</p>

                    <p>
                      Precio: $
                      {Number(court.price).toLocaleString('es-AR')}
                    </p>

                    <div className="detail-actions">
                      <button
                        className="secondary-button"
                        onClick={() =>
                          removeReservationFromCart(
                            court.reservationId
                          )
                        }
                      >
                        Quitar reserva
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="cart-total">
            <h2>
              Total: ${Number(total).toLocaleString('es-AR')}
            </h2>
          </div>

          {hasMixedCart && (
            <p className="checkout-message">
              Tenés productos y reservas en el mismo carrito.
              El checkout actual los procesa por separado.
              Conservamos ambos tipos de artículos y
              evitamos generar una operación incompleta.
            </p>
          )}

          {checkoutError && (
            <p
              className="checkout-message"
              role="alert"
            >
              {checkoutError}
            </p>
          )}

          <div className="detail-actions">
            <button
              className="secondary-button"
              onClick={handleClearCart}
            >
              Vaciar carrito
            </button>

            {productItems.length > 0 && (
              <button
                className="primary-button"
                onClick={handleProductCheckout}
              >
                Ir al checkout de productos
              </button>
            )}

            {reservationClubs.map((club) => (
              <button
                key={club.clubId}
                className="primary-button"
                onClick={() =>
                  handleReservationCheckout(club.clubId)
                }
              >
                {reservationClubs.length === 1
                  ? 'Ir al checkout de reservas'
                  : `Pagar reservas de ${club.clubName}`}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default Cart;
