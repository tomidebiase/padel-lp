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

const expireReservationsIfNeeded = async (reservations) => {
  const now = Date.now();

  const expiredReservations = reservations.filter(
    (reservation) =>
      ['pending_payment', 'proof_submitted'].includes(reservation.status) &&
      reservation.expiresAtMs &&
      reservation.expiresAtMs <= now
  );

  if (expiredReservations.length > 0) {
    await Promise.all(
      expiredReservations.map((reservation) =>
        updateDoc(doc(db, 'reservations', reservation.id), {
          status: 'expired',
          paymentStatus: 'expired',
        })
      )
    );
  }

  return reservations.map((reservation) => {
    if (
      ['pending_payment', 'proof_submitted'].includes(reservation.status) &&
      reservation.expiresAtMs &&
      reservation.expiresAtMs <= now
    ) {
      return {
        ...reservation,
        status: 'expired',
        paymentStatus: 'expired',
      };
    }

    return reservation;
  });
};

export const createReservation = async (reservation) => {
  try {
    const now = Date.now();
    const expiresAtMs =
      reservation.expiresAtMs || now + RESERVATION_HOLD_MINUTES * 60 * 1000;

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

export const getReservationsByCourt = async (clubId, courtId, date) => {
  try {
    const q = query(
      reservationsRef,
      where('clubId', '==', String(clubId)),
      where('courtId', '==', courtId),
      where('date', '==', date)
    );

    const snapshot = await getDocs(q);

    const reservations = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const normalizedReservations = await expireReservationsIfNeeded(reservations);
    const now = Date.now();

    return normalizedReservations.filter((reservation) => {
      if (reservation.status === 'paid') return true;

      if (
        ['pending_payment', 'proof_submitted'].includes(reservation.status) &&
        reservation.expiresAtMs &&
        reservation.expiresAtMs > now
      ) {
        return true;
      }

      return false;
    });
  } catch (error) {
    console.error('Error al obtener reservas:', error);
    return [];
  }
};

export const getReservationsByClub = async (clubId) => {
  try {
    const q = query(reservationsRef, where('clubId', '==', String(clubId)));
    const snapshot = await getDocs(q);

    const reservations = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    const normalizedReservations = await expireReservationsIfNeeded(reservations);

    return normalizedReservations.sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      if (dateCompare !== 0) return dateCompare;

      return String(a.schedule || '').localeCompare(String(b.schedule || ''));
    });
  } catch (error) {
    console.error('Error al obtener reservas del club:', error);
    return [];
  }
};

export const markReservationAsPaid = async (documentId) => {
  try {
    await updateDoc(doc(db, 'reservations', documentId), {
      status: 'paid',
      paymentStatus: 'paid',
      paidAt: Date.now(),
    });
  } catch (error) {
    console.error('Error al marcar reserva como pagada:', error);
    throw error;
  }
};

export const cancelReservation = async (documentId) => {
  try {
    await updateDoc(doc(db, 'reservations', documentId), {
      status: 'cancelled',
      paymentStatus: 'cancelled',
      cancelledAt: Date.now(),
    });
  } catch (error) {
    console.error('Error al cancelar reserva:', error);
    throw error;
  }
};

export const markProofAsSubmitted = async (documentId) => {
  try {
    const newExpiresAtMs = Date.now() + PROOF_REVIEW_HOURS * 60 * 60 * 1000;

    await updateDoc(doc(db, 'reservations', documentId), {
      status: 'proof_submitted',
      paymentStatus: 'proof_submitted',
      proofSubmittedAt: Date.now(),
      expiresAtMs: newExpiresAtMs,
    });
  } catch (error) {
    console.error('Error al marcar comprobante como enviado:', error);
    throw error;
  }
};

export const getClubPaymentData = async (clubId) => {
  try {
    const clubRef = doc(db, 'clubs', String(clubId));
    const clubSnap = await getDoc(clubRef);

    if (!clubSnap.exists()) {
      return null;
    }

    return {
      id: clubSnap.id,
      ...clubSnap.data(),
    };
  } catch (error) {
    console.error('Error al obtener datos del club:', error);
    return null;
  }
};