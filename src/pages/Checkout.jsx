import { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import {
  createReservation,
  getClubPaymentData,
  markProofAsSubmitted,
} from '../firebase/reservations';
import {
  isWithinServiceHours,
  getServiceHoursText,
} from '../utils/serviceHours';

const PADELLP_PAYMENT_DATA = {
  alias: 'padellp.tienda.mp',
  cbu: '0000003100000000000001',
  accountHolder: 'PadelLP Store',
  paymentInstructions:
    'Realizá la transferencia y enviá el comprobante por WhatsApp para validar la compra.',
  whatsappPhone: '5492215064057',
};

function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    cart,
    clearCart,
    clearCartByClub,
    getTotalPriceByClub,
    getProductsTotal,
  } = useContext(CartContext);

  const clubId = String(location.state?.clubId || '');

  const hasProducts = useMemo(
    () => cart.some((item) => item.type === 'product'),
    [cart]
  );

  const productItems = useMemo(
    () => cart.filter((item) => item.type === 'product'),
    [cart]
  );

  const clubCart = useMemo(() => {
    if (!clubId) return [];
    return cart.filter(
      (item) =>
        item.type === 'reservation' && String(item.clubId) === String(clubId)
    );
  }, [cart, clubId]);

  const totalByClub = useMemo(() => {
    if (!clubId) return 0;
    return getTotalPriceByClub(clubId);
  }, [clubId, getTotalPriceByClub]);

  const productsTotal = useMemo(() => getProductsTotal(), [getProductsTotal]);

  const totalToPay = useMemo(() => {
    if (hasProducts) return productsTotal;
    return totalByClub;
  }, [hasProducts, productsTotal, totalByClub]);

  const [paymentMethod, setPaymentMethod] = useState('mp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [message, setMessage] = useState('');
  const [reservationSummary, setReservationSummary] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const { customerName, customerEmail, customerPhone } = formData;

    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setMessage('Completá nombre, email y teléfono.');
      return false;
    }

    const emailIsValid = /\S+@\S+\.\S+/.test(customerEmail);

    if (!emailIsValid) {
      setMessage('Ingresá un email válido.');
      return false;
    }

    return true;
  };

  const buildWhatsappLink = ({
    phone,
    clubName,
    courtName,
    date,
    schedule,
    total,
    customerName,
  }) => {
    const cleanPhone = String(phone || '').replace(/\D/g, '');

    const text = `Hola, ya hice la transferencia de mi reserva en PadelLP.%0A%0ACliente: ${customerName}%0AClub: ${clubName}%0ACancha: ${courtName}%0AFecha: ${date}%0AHorario: ${schedule}%0ATotal: $${Number(
      total
    ).toLocaleString('es-AR')}%0A%0AAdjunto comprobante.`;

    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const buildProductsWhatsappLink = ({ customerName, total }) => {
    const cleanPhone = String(PADELLP_PAYMENT_DATA.whatsappPhone || '').replace(
      /\D/g,
      ''
    );

    const text = `Hola, ya hice la transferencia de mi compra de productos en PadelLP.%0A%0ACliente: ${customerName}%0ATotal: $${Number(
      total
    ).toLocaleString('es-AR')}%0A%0AAdjunto comprobante.`;

    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const buildReservationSummary = ({
    firstReservation,
    total,
    expiresAtMs,
    documentIds,
    paymentMethodSelected,
    clubData,
    customerName,
    paymentStarted = false,
  }) => {
    return {
      clubId: String(firstReservation.clubId),
      clubName: firstReservation.clubName,
      courtName: firstReservation.name,
      date: firstReservation.date,
      schedule: firstReservation.schedule,
      total,
      expiresAtMs,
      reservationsCount: clubCart.length,
      documentIds,
      proofSubmitted: false,
      paymentMethod: paymentMethodSelected,
      alias: clubData?.alias || '',
      cbu: clubData?.cbu || '',
      accountHolder: clubData?.accountHolder || '',
      paymentInstructions: clubData?.paymentInstructions || '',
      whatsappPhone: clubData?.whatsappPhone || '',
      paymentStarted,
      whatsappLink: buildWhatsappLink({
        phone: clubData?.whatsappPhone || '',
        clubName: firstReservation.clubName,
        courtName: firstReservation.name,
        date: firstReservation.date,
        schedule: firstReservation.schedule,
        total,
        customerName,
      }),
    };
  };

  const createReservationsForSelectedClub = async ({
    paymentMethodSelected,
    reservationStatus = 'pending_payment',
    reservationPaymentStatus = 'pending',
  }) => {
    const expiresAtMs = Date.now() + 10 * 60 * 1000;
    const createdDocumentIds = [];

    for (const reservation of clubCart) {
      const documentId = await createReservation({
        reservationId: reservation.reservationId,
        clubId: String(reservation.clubId),
        clubName: reservation.clubName,
        courtId: reservation.courtId,
        courtName: reservation.name,
        location: reservation.location,
        date: reservation.date,
        schedule: reservation.schedule,
        price: Number(reservation.price),

        customerName: formData.customerName.trim(),
        customerEmail: formData.customerEmail.trim(),
        customerPhone: formData.customerPhone.trim(),

        status: 'pending_payment',
        paymentStatus: reservationPaymentStatus,
        paymentMethod: paymentMethodSelected,
        expiresAtMs,
      });

      createdDocumentIds.push(documentId);
    }

    return {
      expiresAtMs,
      createdDocumentIds,
    };
  };

  const handleCheckout = async () => {
    if (!isWithinServiceHours()) {
      setMessage('Las reservas solo están disponibles de 09:00 a 23:00.');
      return;
    }

    if (!hasProducts && (!clubId || clubCart.length === 0)) {
      setMessage('No hay reservas para confirmar.');
      return;
    }

    if (hasProducts && productItems.length === 0) {
      setMessage('No hay productos para confirmar.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setIsProcessing(true);
      setMessage('');

      if (hasProducts) {
        const summaryData = {
          type: 'products',
          total: productsTotal,
          productsCount: productItems.reduce(
            (acc, item) => acc + Number(item.quantity || 1),
            0
          ),
          paymentMethod,
          customerName: formData.customerName.trim(),
          alias: PADELLP_PAYMENT_DATA.alias,
          cbu: PADELLP_PAYMENT_DATA.cbu,
          accountHolder: PADELLP_PAYMENT_DATA.accountHolder,
          paymentInstructions: PADELLP_PAYMENT_DATA.paymentInstructions,
          whatsappPhone: PADELLP_PAYMENT_DATA.whatsappPhone,
          whatsappLink: buildProductsWhatsappLink({
            customerName: formData.customerName.trim(),
            total: productsTotal,
          }),
          paymentStarted: paymentMethod === 'mp',
        };

        clearCart();

        setReservationSummary(summaryData);

        setFormData({
          customerName: '',
          customerEmail: '',
          customerPhone: '',
        });

        setMessage('Compra generada con éxito.');
        setIsProcessing(false);
        return;
      }

      const firstReservation = clubCart[0];
      const clubData = await getClubPaymentData(firstReservation.clubId);

      const { expiresAtMs, createdDocumentIds } =
        await createReservationsForSelectedClub({
          paymentMethodSelected: paymentMethod,
          reservationPaymentStatus: 'pending',
        });

      const summaryData = buildReservationSummary({
        firstReservation,
        total: totalByClub,
        expiresAtMs,
        documentIds: createdDocumentIds,
        paymentMethodSelected: paymentMethod,
        clubData,
        customerName: formData.customerName.trim(),
        paymentStarted: false,
      });

      clearCartByClub(clubId);

      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
      });

      if (paymentMethod === 'mp') {
        try {
          const payload = {
            title: `Reserva ${firstReservation?.clubName || 'PadelLP'}`,
            price: Number(totalByClub),
            quantity: 1,
            reservationId: firstReservation?.reservationId || '',
            customerName: formData.customerName.trim(),
            customerEmail: formData.customerEmail.trim(),
          };

          console.log('MP REQUEST PAYLOAD:', payload);

          const response = await fetch(
            'http://127.0.0.1:5001/padellp-6f520/southamerica-east1/createMercadoPagoPreference',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            }
          );

          const rawText = await response.text();
          console.log('MP RAW RESPONSE:', rawText);

          let data = {};
          try {
            data = rawText ? JSON.parse(rawText) : {};
          } catch (parseError) {
            console.error('No se pudo parsear la respuesta JSON:', parseError);
            throw new Error('La respuesta de Mercado Pago no vino en formato JSON.');
          }

          console.log('MP PARSED RESPONSE:', data);

          if (!response.ok) {
            throw new Error(data?.error || 'No se pudo iniciar Mercado Pago');
          }

          const redirectUrl = data.init_point || data.sandbox_init_point;

          if (!redirectUrl) {
            throw new Error('La preferencia se creó sin URL de pago.');
          }

          setReservationSummary({
            ...summaryData,
            paymentStarted: true,
          });

          window.location.href = redirectUrl;
          return;
        } catch (error) {
          console.error('Error iniciando Mercado Pago:', error);

          setReservationSummary(summaryData);
          setMessage(
            'La reserva quedó creada, pero no se pudo iniciar Mercado Pago. Podés verla en el admin como pendiente.'
          );
          return;
        }
      }

      setReservationSummary(summaryData);
      setMessage('Reserva temporal generada con éxito.');
    } catch (error) {
      console.error('Error en checkout:', error);
      setMessage('Hubo un error al generar la reserva.');
    } finally {
      if (!hasProducts) {
        setIsProcessing(false);
      }
    }
  };

  const handleProofSubmitted = async () => {
    if (!isWithinServiceHours()) {
      alert('El envío de comprobantes solo está disponible de 09:00 a 23:00.');
      return;
    }

    if (!reservationSummary?.documentIds?.length) return;

    try {
      setIsSubmittingProof(true);

      await Promise.all(
        reservationSummary.documentIds.map((documentId) =>
          markProofAsSubmitted(documentId)
        )
      );

      const newExpiresAtMs = Date.now() + 2 * 60 * 60 * 1000;

      setReservationSummary((prev) => ({
        ...prev,
        proofSubmitted: true,
        expiresAtMs: newExpiresAtMs,
      }));
    } catch (error) {
      console.error('Error al informar comprobante:', error);
    } finally {
      setIsSubmittingProof(false);
    }
  };

  if (reservationSummary) {
    if (reservationSummary.type === 'products') {
      return (
        <section className="checkout-page">
          <div className="checkout-card">
            <div className="service-hours-box">
              <p>{getServiceHoursText()}</p>
            </div>

            <div className="checkout-success-badge">Compra generada</div>

            <h1 className="checkout-title">Compra confirmada</h1>

            <p className="checkout-subtitle">
              Tu pedido de productos fue generado correctamente.
            </p>

            {message && <p className="checkout-message">{message}</p>}

            <div className="checkout-summary-grid">
              <div className="checkout-summary-box">
                <span className="checkout-summary-label">Productos</span>
                <p>{reservationSummary.productsCount}</p>
              </div>

              <div className="checkout-summary-box">
                <span className="checkout-summary-label">Total</span>
                <p>${Number(reservationSummary.total).toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="checkout-status-box">
              <p>
                Estado actual:{' '}
                <strong>
                  {reservationSummary.paymentMethod === 'mp'
                    ? 'Pendiente de pago con Mercado Pago'
                    : 'Pendiente de pago'}
                </strong>
              </p>

              <p>
                {reservationSummary.paymentMethod === 'mp'
                  ? 'La compra quedó registrada y el pago online de PadelLP se encuentra en estado simulado para el proyecto.'
                  : 'Realizá la transferencia y enviá el comprobante para validar la compra.'}
              </p>
            </div>

            {reservationSummary.paymentMethod === 'alias' && (
              <div className="checkout-form-card">
                <div className="checkout-form-header">
                  <h2>Datos para transferir</h2>
                  <p>Realizá la transferencia y después enviá el comprobante.</p>
                </div>

                <div className="checkout-payment-grid">
                  <div className="checkout-payment-box">
                    <span className="checkout-summary-label">Alias</span>
                    <p>{reservationSummary.alias}</p>
                  </div>

                  <div className="checkout-payment-box">
                    <span className="checkout-summary-label">CBU</span>
                    <p>{reservationSummary.cbu}</p>
                  </div>

                  <div className="checkout-payment-box full-width">
                    <span className="checkout-summary-label">Titular</span>
                    <p>{reservationSummary.accountHolder}</p>
                  </div>

                  <div className="checkout-payment-box full-width">
                    <span className="checkout-summary-label">Instrucciones</span>
                    <p>{reservationSummary.paymentInstructions}</p>
                  </div>
                </div>

                <div className="detail-actions">
                  <a
                    className="primary-button"
                    href={reservationSummary.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Enviar comprobante por WhatsApp
                  </a>
                </div>
              </div>
            )}

            {reservationSummary.paymentMethod === 'mp' && (
              <div className="checkout-form-card">
                <div className="checkout-form-header">
                  <h2>Mercado Pago</h2>
                  <p>
                    Pago online de productos generado de forma simulada para
                    PadelLP.
                  </p>
                </div>
              </div>
            )}

            <div className="detail-actions">
              <button
                className="secondary-button"
                onClick={() => navigate('/productos')}
              >
                Seguir comprando
              </button>
            </div>
          </div>
        </section>
      );
    }

    const expirationDate = new Date(reservationSummary.expiresAtMs);

    return (
      <section className="checkout-page">
        <div className="checkout-card">
          <div className="service-hours-box">
            <p>{getServiceHoursText()}</p>
            {!isWithinServiceHours() && (
              <p className="service-hours-warning">
                Fuera de este horario el club no procesa reservas ni pagos.
              </p>
            )}
          </div>

          <div className="checkout-success-badge">Reserva temporal creada</div>

          <h1 className="checkout-title">Reserva generada</h1>

          <p className="checkout-subtitle">
            Tu reserva de {reservationSummary.clubName} fue creada correctamente y
            quedó pendiente de pago.
          </p>

          {message && <p className="checkout-message">{message}</p>}

          <div className="checkout-summary-grid">
            <div className="checkout-summary-box">
              <span className="checkout-summary-label">Turnos</span>
              <p>{reservationSummary.reservationsCount}</p>
            </div>

            <div className="checkout-summary-box">
              <span className="checkout-summary-label">Total</span>
              <p>${Number(reservationSummary.total).toLocaleString()}</p>
            </div>
          </div>

          <div className="checkout-status-box">
            <p>
              Estado actual:{' '}
              <strong>
                {reservationSummary.proofSubmitted
                  ? 'Comprobante enviado'
                  : reservationSummary.paymentMethod === 'mp'
                  ? 'Pendiente de pago con Mercado Pago'
                  : 'Pendiente de pago'}
              </strong>
            </p>

            <p>
              {reservationSummary.paymentMethod === 'mp'
                ? reservationSummary.paymentStarted
                  ? 'Tu reserva quedó creada y ahora continúa el pago online.'
                  : 'Tu reserva quedó creada, pero el inicio del pago online falló. El club puede verla en el panel como pendiente.'
                : reservationSummary.proofSubmitted
                ? 'Recibimos el aviso de tu comprobante. Ahora el club tiene más tiempo para revisarlo antes de liberar el turno.'
                : 'Tenés tiempo limitado para completar el pago. Si no pagás, el horario se libera automáticamente.'}
            </p>

            <p>
              Vence a las{' '}
              <strong>
                {expirationDate.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
              .
            </p>
          </div>

          {reservationSummary.paymentMethod === 'alias' && (
            <div className="checkout-form-card">
              <div className="checkout-form-header">
                <h2>Datos para transferir</h2>
                <p>Realizá la transferencia y después enviá el comprobante.</p>
              </div>

              <div className="checkout-payment-grid">
                <div className="checkout-payment-box">
                  <span className="checkout-summary-label">Alias</span>
                  <p>{reservationSummary.alias || 'No configurado'}</p>
                </div>

                <div className="checkout-payment-box">
                  <span className="checkout-summary-label">CBU</span>
                  <p>{reservationSummary.cbu || 'No configurado'}</p>
                </div>

                <div className="checkout-payment-box full-width">
                  <span className="checkout-summary-label">Titular</span>
                  <p>{reservationSummary.accountHolder || 'No configurado'}</p>
                </div>

                <div className="checkout-payment-box full-width">
                  <span className="checkout-summary-label">Instrucciones</span>
                  <p>
                    {reservationSummary.paymentInstructions ||
                      'Enviar comprobante al contacto del club.'}
                  </p>
                </div>
              </div>

              <div className="detail-actions">
                <a
                  className="primary-button"
                  href={reservationSummary.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  Enviar comprobante por WhatsApp
                </a>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={handleProofSubmitted}
                  disabled={
                    !isWithinServiceHours() ||
                    isSubmittingProof ||
                    reservationSummary.proofSubmitted
                  }
                >
                  {reservationSummary.proofSubmitted
                    ? 'Comprobante enviado'
                    : isSubmittingProof
                    ? 'Guardando...'
                    : 'Ya envié el comprobante'}
                </button>
              </div>
            </div>
          )}

          {reservationSummary.paymentMethod === 'mp' && (
            <div className="checkout-form-card">
              <div className="checkout-form-header">
                <h2>Mercado Pago</h2>
                <p>
                  {reservationSummary.paymentStarted
                    ? 'Te estamos redirigiendo a Mercado Pago para completar el pago.'
                    : 'No se pudo iniciar Mercado Pago, pero la reserva quedó registrada como pendiente.'}
                </p>
              </div>
            </div>
          )}

          <div className="detail-actions">
            <button
              className="secondary-button"
              onClick={() => navigate('/carrito')}
            >
              Volver al carrito
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-page">
      <div className="checkout-card">
        <div className="service-hours-box">
          <p>{getServiceHoursText()}</p>
          {!isWithinServiceHours() && (
            <p className="service-hours-warning">
              En este momento no se pueden generar reservas.
            </p>
          )}
        </div>

        <h1 className="checkout-title">Checkout</h1>
        <p className="checkout-subtitle">
          Completá tus datos para confirmar tu compra o reserva.
        </p>

        {message && <p className="checkout-message">{message}</p>}

        {!hasProducts && !clubId ? (
          <>
            <p className="checkout-empty">No se indicó qué club querés pagar.</p>

            <div className="detail-actions">
              <button
                className="secondary-button"
                onClick={() => navigate('/carrito')}
              >
                Volver al carrito
              </button>
            </div>
          </>
        ) : !hasProducts && clubCart.length === 0 ? (
          <>
            <p className="checkout-empty">
              No hay reservas de este club para confirmar.
            </p>

            <div className="detail-actions">
              <button
                className="secondary-button"
                onClick={() => navigate('/carrito')}
              >
                Volver al carrito
              </button>
            </div>
          </>
        ) : (
          <>
            {hasProducts ? (
              <>
                <div className="checkout-form-card" style={{ marginBottom: '1rem' }}>
                  <div className="checkout-form-header">
                    <h2>Resumen de productos</h2>
                    <p>Estos son los productos que estás por comprar.</p>
                  </div>

                  <div className="cart-list">
                    {productItems.map((product) => (
                      <article className="cart-item" key={product.id}>
                        <h3>{product.name}</h3>
                        <p>Marca: {product.brand}</p>
                        <p>Cantidad: {product.quantity}</p>
                        <p>
                          Precio unitario: $
                          {Number(product.price).toLocaleString('es-AR')}
                        </p>
                        <p>
                          Subtotal: $
                          {Number(product.price * product.quantity).toLocaleString(
                            'es-AR'
                          )}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="cart-total">
                  <h2>Total: ${Number(productsTotal).toLocaleString('es-AR')}</h2>
                </div>
              </>
            ) : (
              <>
                <div className="cart-list">
                  {clubCart.map((court) => (
                    <article className="cart-item" key={court.reservationId}>
                      <h3>{court.name}</h3>
                      <p>Club: {court.clubName}</p>
                      <p>Día: {court.date}</p>
                      <p>Precio: ${Number(court.price).toLocaleString()}</p>
                      <p>Horario: {court.schedule}</p>
                    </article>
                  ))}
                </div>

                <div className="cart-total">
                  <h2>Total: ${Number(totalByClub).toLocaleString()}</h2>
                </div>
              </>
            )}

            <form
              className="checkout-form-card"
              autoComplete="off"
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckout();
              }}
            >
              <div className="checkout-form-header">
                <h2>Tus datos</h2>
                <p>Usamos esta información para identificar la operación.</p>
              </div>

              <div className="checkout-form-grid">
                <div className="form-field full-width">
                  <label htmlFor="customerName">Nombre y apellido</label>
                  <input
                    id="customerName"
                    name="customerName"
                    type="text"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez"
                    autoComplete="off"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="customerEmail">Email</label>
                  <input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    placeholder="mail@ejemplo.com"
                    autoComplete="off"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="customerPhone">Teléfono</label>
                  <input
                    id="customerPhone"
                    name="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    placeholder="2211234567"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="checkout-form-header" style={{ marginTop: '1.5rem' }}>
                <h2>Método de pago</h2>
                <p>
                  {hasProducts
                    ? 'Elegí cómo querés pagar tu compra.'
                    : 'Elegí cómo querés pagar tu reserva.'}
                </p>
              </div>

              <div className="checkout-payment-grid">
                <label
                  className="checkout-payment-box"
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mp"
                    checked={paymentMethod === 'mp'}
                    onChange={() => setPaymentMethod('mp')}
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <span className="checkout-summary-label">Mercado Pago</span>
                  <p>Pago online inmediato</p>
                </label>

                <label
                  className="checkout-payment-box"
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="alias"
                    checked={paymentMethod === 'alias'}
                    onChange={() => setPaymentMethod('alias')}
                    style={{ marginBottom: '0.75rem' }}
                  />
                  <span className="checkout-summary-label">
                    Transferencia / alias
                  </span>
                  <p>
                    {hasProducts
                      ? 'Pago manual para compra de productos'
                      : 'Pagás y enviás comprobante'}
                  </p>
                </label>
              </div>

              <div className="detail-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => navigate('/carrito')}
                  disabled={isProcessing}
                >
                  Volver al carrito
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={!isWithinServiceHours() || isProcessing}
                >
                  {isProcessing
                    ? 'Procesando...'
                    : paymentMethod === 'mp'
                    ? 'Pagar con Mercado Pago'
                    : hasProducts
                    ? 'Confirmar compra'
                    : 'Generar reserva'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default Checkout;