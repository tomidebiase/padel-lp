const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const { Resend } = require('resend');
const { MercadoPagoConfig, Preference } = require('mercadopago');

admin.initializeApp();

const db = admin.firestore();

const resendApiKey = defineSecret('RESEND_API_KEY');
const mercadoPagoAccessToken = defineSecret('MERCADOPAGO_ACCESS_TOKEN');

const DEFAULT_WHATSAPP_PHONE = '5492210000000';

exports.sendReservationEmail = onDocumentCreated(
  {
    document: 'reservations/{id}',
    region: 'southamerica-east1',
    secrets: [resendApiKey],
  },
  async (event) => {
    try {
      const snapshot = event.data;

      if (!snapshot) {
        console.error('No llegó snapshot del documento.');
        return;
      }

      const reservation = snapshot.data();
      const documentId = snapshot.id;

      if (!reservation?.customerEmail) {
        console.error('La reserva no tiene customerEmail.');
        return;
      }

      const clubId = String(reservation.clubId || '');
      const clubDoc = await db.collection('clubs').doc(clubId).get();

      if (!clubDoc.exists) {
        console.error(`No existe el club ${clubId} en Firestore.`);
        return;
      }

      const club = clubDoc.data();

      const customerName = reservation.customerName || 'Cliente';
      const clubName = reservation.clubName || club.name || 'Club';
      const courtName = reservation.courtName || 'Cancha';
      const date = reservation.date || '-';
      const schedule = reservation.schedule || '-';
      const price = Number(reservation.price || 0);
      const alias = club.alias || 'No configurado';
      const cbu = club.cbu || 'No configurado';
      const accountHolder = club.accountHolder || 'No configurado';
      const paymentInstructions =
        club.paymentInstructions || 'Enviar comprobante al contacto del club.';
      const whatsappPhone = String(
        club.whatsappPhone || DEFAULT_WHATSAPP_PHONE
      ).replace(/\D/g, '');

      const expirationText = reservation.expiresAtMs
        ? new Date(reservation.expiresAtMs).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'sin horario definido';

      const whatsappMessage = [
        'Hola, ya realicé el pago de mi reserva en PadelLP.',
        '',
        `Cliente: ${customerName}`,
        `Club: ${clubName}`,
        `Cancha: ${courtName}`,
        `Fecha: ${date}`,
        `Horario: ${schedule}`,
        `Total: $${price.toLocaleString('es-AR')}`,
        '',
        'Adjunto comprobante.',
      ].join('\n');

      const whatsappLink = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        whatsappMessage
      )}`;

      const resend = new Resend(resendApiKey.value());

      const html = `
        <div style="font-family: Arial, Helvetica, sans-serif; color: #0f172a; line-height: 1.6; max-width: 640px; margin: 0 auto; padding: 24px;">
          <div style="display:inline-block; background:#e8f7ee; color:#15803d; padding:8px 14px; border-radius:999px; font-size:14px; font-weight:700; margin-bottom:16px;">
            Reserva temporal creada
          </div>

          <h2 style="margin:0 0 12px; font-size:32px; line-height:1.1; color:#0f172a;">
            Tu reserva en PadelLP
          </h2>

          <p style="margin:0 0 16px; color:#475569;">
            Hola <strong>${customerName}</strong>, tu reserva fue creada correctamente y quedó pendiente de pago.
          </p>

          <div style="background:#f8fbff; border:1px solid #dbe3ef; border-radius:18px; padding:18px; margin:18px 0;">
            <h3 style="margin:0 0 12px; font-size:18px; color:#0f172a;">Detalle de la reserva</h3>
            <ul style="padding-left:18px; margin:0; color:#334155;">
              <li><strong>Club:</strong> ${clubName}</li>
              <li><strong>Cancha:</strong> ${courtName}</li>
              <li><strong>Fecha:</strong> ${date}</li>
              <li><strong>Horario:</strong> ${schedule}</li>
              <li><strong>Total:</strong> $${price.toLocaleString('es-AR')}</li>
            </ul>
          </div>

          <div style="background:#f8fbff; border:1px solid #dbe3ef; border-radius:18px; padding:18px; margin:18px 0;">
            <h3 style="margin:0 0 12px; font-size:18px; color:#0f172a;">Datos para pagar</h3>
            <p style="margin:0 0 8px;"><strong>Alias:</strong> ${alias}</p>
            <p style="margin:0 0 8px;"><strong>CBU:</strong> ${cbu}</p>
            <p style="margin:0 0 12px;"><strong>Titular:</strong> ${accountHolder}</p>
            <p style="margin:0; color:#475569;">${paymentInstructions}</p>
          </div>

          <div style="margin:24px 0;">
            <a
              href="${whatsappLink}"
              target="_blank"
              style="
                display:inline-block;
                padding:14px 20px;
                background:#25D366;
                color:#ffffff;
                text-decoration:none;
                border-radius:10px;
                font-weight:700;
              "
            >
              Enviar comprobante por WhatsApp
            </a>
          </div>

          <div style="background:#fff7d6; border:1px solid #fde68a; border-radius:18px; padding:16px; margin-top:18px; color:#8a5a00;">
            <p style="margin:0 0 8px;">
              <strong>Estado actual:</strong> Pendiente de pago
            </p>
            <p style="margin:0;">
              Tenés tiempo hasta las <strong>${expirationText}</strong> para completar el pago. Si no pagás a tiempo, el turno se libera automáticamente.
            </p>
          </div>

          <p style="margin-top:20px; font-size:13px; color:#64748b;">
            ID de reserva: ${reservation.reservationId || documentId}
          </p>
        </div>
      `;

      const result = await resend.emails.send({
        from: 'PadelLP <onboarding@resend.dev>',
        to: [reservation.customerEmail],
        subject: `Tu reserva en PadelLP - ${clubName}`,
        html,
      });

      await db.collection('reservations').doc(documentId).update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailProviderId: result?.data?.id || null,
      });

      console.log(`Mail enviado correctamente para la reserva ${documentId}`);
    } catch (error) {
      console.error('Error enviando mail de reserva:', error);
    }
  }
);

exports.createMercadoPagoPreference = onRequest(
  {
    region: 'southamerica-east1',
    secrets: [mercadoPagoAccessToken],
    cors: true,
  },
  async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({
          error: 'Método no permitido',
        });
      }

      const {
        title,
        price,
        quantity = 1,
        reservationId,
        customerName,
        customerEmail,
      } = req.body || {};

      console.log('BODY RECIBIDO MP:', req.body);

      if (!title || !price) {
        return res.status(400).json({
          error: 'Faltan title o price',
        });
      }

      const client = new MercadoPagoConfig({
        accessToken: mercadoPagoAccessToken.value(),
      });

      const preference = new Preference(client);

      const response = await preference.create({
        body: {
          items: [
            {
              title: String(title),
              unit_price: Number(price),
              quantity: Number(quantity),
              currency_id: 'ARS',
            },
          ],
          payer: {
            name: customerName || '',
            email: customerEmail || '',
          },
          back_urls: {
            success: 'http://localhost:5173/checkout?mp_status=success',
            failure: 'http://localhost:5173/checkout?mp_status=failure',
            pending: 'http://localhost:5173/checkout?mp_status=pending',
          },
          external_reference: reservationId || '',
        },
      });

      console.log('PREFERENCE MP CREADA:', response);

      return res.status(200).json({
        init_point: response.init_point,
        sandbox_init_point: response.sandbox_init_point || null,
        preference_id: response.id,
      });
    } catch (error) {
      console.error('Error creando preferencia de Mercado Pago:', error);

      return res.status(500).json({
        error: 'Error creando preferencia de Mercado Pago',
        detail: error.message,
      });
    }
  }
);