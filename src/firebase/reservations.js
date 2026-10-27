
import { db } from './config';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from 'firebase/firestore';

const reservationsRef = collection(db, 'reservations');

const RESERVATION_HOLD_MINUTES = 10;
const PROOF_REVIEW_HOURS = 2;

const PENDING_STATUSES = [
  'pending_payment',
  'proof_submitted',
];

function hasExpired(reservation, now = Date.now()) {
  return (
    PENDING_STATUSES.includes(reservation.status) &&
    Number.isFinite(Number(reservation.expiresAtMs)) &&
    Number(reservation.expiresAtMs) > 0 &&
    Number(reservation.expiresAtMs) <= now
  );
}

// Normalizar reservas vencidas solamente para mostrarlas.
// No escribimos en Firestore desde una consulta.
function normalizeExpiredReservations(reservations) {
  const now = Date.now();

  return reservations.map((reservation) => {
    if (!hasExpired(reservation, now)) {
      return reservation;
    }

    return {
      ...reservation,
      status: 'expired',
      paymentStatus: 'expired',
    };
  });
}

// Esta función sigue bloqueada por las reglas actuales.
// En la próxima etapa la conectaremos con el backend seguro.
export const createReservation = async (reservation) => {
  try {
    const now = Date.now();

    const expiresAtMs =
      reservation.expiresAtMs ||
      now + RESERVATION_HOLD_MINUTES * 60 * 1000;

    const docRef = await addDoc(reservationsRef, {
      reservationId: reservation.reservationId,
      clubId: String(reservation.clubId),
      clubName: reservation.clubName,
      courtId: reservation.courtId,
      courtName: reservation.courtName,
      location: reservation.location,
      date: reservation.date,
      schedule: reservation.schedule,
      price: Number(reservation.price),

      customerName: reservation.customerName,
      customerEmail: reservation.customerEmail,
      customerPhone: reservation.customerPhone,

      status: reservation.status || 'pending_payment',
      paymentStatus: reservation.paymentStatus || 'pending',
      paymentMethod: reservation.paymentMethod || null,

      createdAt: serverTimestamp(),
      expiresAtMs,

      paidAt: reservation.paidAt || null,
      cancelledAt: reservation.cancelledAt || null,
      proofSubmittedAt: reservation.proofSubmittedAt || null,
    });

    return docRef.id;
  } catch (error) {
    console.error('Error al guardar reserva:', error);
    throw error;
  }
};

// Consultar horarios ocupados de una cancha.
export const getReservationsByCourt = async (
  clubId,
  courtId,
  date
) => {
  try {
    const q = query(
      reservationsRef,
      where('clubId', '==', String(clubId)),
      where('courtId', '==', String(courtId)),
      where('date', '==', date)
    );

    const snapshot = await getDocs(q);

    const reservations = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const normalized = normalizeExpiredReservations(
      reservations
    );

    const now = Date.now();

    return normalized.filter((reservation) => {
      // Una reserva pagada ocupa el turno.
      if (reservation.status === 'paid') {
        return true;
      }

      // Una reserva pendiente ocupa el turno
      // mientras no haya vencido.
      if (PENDING_STATUSES.includes(reservation.status)) {
        const expiresAtMs = Number(
          reservation.expiresAtMs
        );

        // Si falta una fecha de vencimiento válida,
        // no damos el turno por libre.
        if (
          !Number.isFinite(expiresAtMs) ||
          expiresAtMs <= 0
        ) {
          return true;
        }

        return expiresAtMs > now;
      }

      return false;
    });
  } catch (error) {
    console.error(
      'No se pudo verificar disponibilidad de la cancha:',
      error
    );

    // IMPORTANTE:
    // No devolver [] cuando hay un error.
    // Una lista vacía aparentaría que todos
    // los horarios están disponibles.
    throw error;
  }
};

// Consultar reservas para el panel del club.
export const getReservationsByClub = async (clubId) => {
  try {
    const q = query(
      reservationsRef,
      where('clubId', '==', String(clubId))
    );

    const snapshot = await getDocs(q);

    const reservations = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const normalized = normalizeExpiredReservations(
      reservations
    );

    return normalized.sort((a, b) => {
      const dateCompare = String(
        a.date || ''
      ).localeCompare(String(b.date || ''));

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return String(a.schedule || '').localeCompare(
        String(b.schedule || '')
      );
    });
  } catch (error) {
    console.error(
      'Error al obtener reservas del club:',
      error
    );

    // El panel debe conocer el error real
    // y no confundirlo con cero reservas.
    throw error;
  }
};

// Pendiente de migrar a una operación
// administrativa validada por el backend.
export const markReservationAsPaid = async (documentId) => {
  try {
    await updateDoc(
      doc(db, 'reservations', documentId),
      {
        status: 'paid',
        paymentStatus: 'paid',
        paidAt: Date.now(),
      }
    );
  } catch (error) {
    console.error(
      'Error al marcar reserva como pagada:',
      error
    );

    throw error;
  }
};

// Pendiente de migrar a una operación
// administrativa validada por el backend.
export const cancelReservation = async (documentId) => {
  try {
    await updateDoc(
      doc(db, 'reservations', documentId),
      {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        cancelledAt: Date.now(),
      }
    );
  } catch (error) {
    console.error(
      'Error al cancelar reserva:',
      error
    );

    throw error;
  }
};

export const markProofAsSubmitted = async (documentId) => {
  try {
    const newExpiresAtMs =
      Date.now() +
      PROOF_REVIEW_HOURS * 60 * 60 * 1000;

    await updateDoc(
      doc(db, 'reservations', documentId),
      {
        status: 'proof_submitted',
        paymentStatus: 'proof_submitted',
        proofSubmittedAt: Date.now(),
        expiresAtMs: newExpiresAtMs,
      }
    );
  } catch (error) {
    console.error(
      'Error al informar comprobante:',
      error
    );

    throw error;
  }
};

// Consultar información del club.
export const getClubPaymentData = async (clubId) => {
  try {
    const clubRef = doc(
      db,
      'clubs',
      String(clubId)
    );

    const clubSnap = await getDoc(clubRef);

    if (!clubSnap.exists()) {
      return null;
    }

    return {
      id: clubSnap.id,
      ...clubSnap.data(),
    };
  } catch (error) {
    console.error(
      'Error al obtener datos del club:',
      error
    );

    return null;
  }
};
