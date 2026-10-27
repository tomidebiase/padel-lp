
import {
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  useNavigate,
  useParams,
} from 'react-router-dom';

import { CartContext } from '../context/CartContext';

import {
  getReservationsByCourt,
} from '../firebase/reservations';

const clubsData = [
  {
    clubId: '1',
    clubName: 'Padel Center La Plata',
    location: 'La Plata',
  },
  {
    clubId: '2',
    clubName: 'Arena Padel City Bell',
    location: 'City Bell',
  },
  {
    clubId: '3',
    clubName: 'Gonnet Padel Club',
    location: 'Gonnet',
  },
];

const courtsData = clubsData.flatMap(
  (club, clubIndex) =>
    Array.from({ length: 4 }, (_, courtIndex) => ({
      id: String(clubIndex * 4 + courtIndex + 1),
      clubId: club.clubId,
      clubName: club.clubName,
      courtId: `cancha-${courtIndex + 1}`,
      name: `Cancha ${courtIndex + 1}`,
      location: club.location,
      price: 40000,
    }))
);

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    date.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function generateSchedules() {
  const schedules = [];

  let hour = 10;
  let minute = 0;

  while (hour < 22) {
    const start =
      `${String(hour).padStart(2, '0')}:` +
      `${String(minute).padStart(2, '0')}`;

    let endHour = hour;
    let endMinute = minute + 30;

    if (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
    }

    endHour += 1;

    const end =
      `${String(endHour).padStart(2, '0')}:` +
      `${String(endMinute).padStart(2, '0')}`;

    schedules.push(`${start} - ${end}`);

    hour = endHour;
    minute = endMinute;
  }

  return schedules;
}

const SCHEDULES = generateSchedules();

function isPastSchedule(dateString, schedule) {
  const now = new Date();
  const today = getLocalDateString(now);

  if (dateString < today) {
    return true;
  }

  if (dateString > today) {
    return false;
  }

  const [startTime] = schedule.split(' - ');

  const [hours, minutes] = startTime
    .split(':')
    .map(Number);

  const startDate = new Date(now);

  startDate.setHours(
    hours,
    minutes,
    0,
    0
  );

  return startDate <= now;
}

function CourtDetail() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    addReservationToCart,
    isSlotInCart,
  } = useContext(CartContext);

  const court = courtsData.find(
    (item) => item.id === id
  );

  const [selectedDate, setSelectedDate] = useState(
    getLocalDateString()
  );

  const [
    confirmedSchedules,
    setConfirmedSchedules,
  ] = useState([]);

  const [
    availabilityStatus,
    setAvailabilityStatus,
  ] = useState('loading');

  const [message, setMessage] = useState('');

  const handleGoBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!court) return;

    let cancelled = false;

    const fetchReservations = async () => {
      // Mientras se consulta, no ofrecemos turnos.
      setAvailabilityStatus('loading');
      setConfirmedSchedules([]);

      try {
        const reservations = await getReservationsByCourt(
          String(court.clubId),
          court.courtId,
          selectedDate
        );

        if (cancelled) return;

        const occupiedSchedules = reservations.map(
          (reservation) => reservation.schedule
        );

        setConfirmedSchedules(occupiedSchedules);
        setAvailabilityStatus('ready');
      } catch (error) {
        console.error(
          'Error al consultar disponibilidad:',
          error
        );

        if (cancelled) return;

        setConfirmedSchedules([]);
        setAvailabilityStatus('error');
      }
    };

    fetchReservations();

    return () => {
      cancelled = true;
    };
  }, [court, selectedDate]);

  const handleReserve = (schedule) => {
    setMessage('');

    if (!court) return;

    // Nunca permitir seleccionar un horario
    // si no se confirmó la disponibilidad.
    if (availabilityStatus !== 'ready') {
      setMessage(
        'Todavía no podemos verificar este horario. ' +
        'Intentá nuevamente más tarde.'
      );
      return;
    }

    if (selectedDate < getLocalDateString()) {
      setMessage(
        'No podés reservar una fecha anterior a hoy.'
      );
      return;
    }

    if (confirmedSchedules.includes(schedule)) {
      setMessage(
        'Ese horario ya no está disponible.'
      );
      return;
    }

    if (isPastSchedule(selectedDate, schedule)) {
      setMessage(
        'Ese horario ya pasó y no está disponible.'
      );
      return;
    }

    if (
      isSlotInCart(
        String(court.clubId),
        court.courtId,
        selectedDate,
        schedule
      )
    ) {
      setMessage(
        'Ese horario ya lo agregaste al carrito.'
      );
      return;
    }

    try {
      const result = addReservationToCart({
        reservationId: crypto.randomUUID(),
        clubId: String(court.clubId),
        clubName: court.clubName,
        courtId: court.courtId,
        name: court.name,
        courtName: court.name,
        location: court.location,
        date: selectedDate,
        schedule,
        price: court.price,
      });

      if (result?.success === false) {
        setMessage(
          result.message ||
          'No se pudo agregar el turno.'
        );
        return;
      }

      setMessage(
        'Horario agregado al carrito.'
      );
    } catch (error) {
      console.error(
        'Error al agregar el turno:',
        error
      );

      setMessage(
        'No se pudo agregar el turno al carrito.'
      );
    }
  };

  if (!court) {
    return (
      <section className="court-detail-page">
        <h1>Cancha no encontrada</h1>

        <div className="detail-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleGoBack}
          >
            ← Volver
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="court-detail-page">
      <div className="court-detail-header">
        <div className="court-detail-badge">
          Reserva de turno
        </div>

        <h1 className="court-title">
          {court.name}
        </h1>

        <p className="court-subtitle">
          {court.clubName} · {court.location}
        </p>
      </div>

      <div className="court-info-grid">
        <div className="court-info-box">
          <span className="court-info-label">
            Precio
          </span>

          <p>
            ${court.price.toLocaleString('es-AR')} por turno
          </p>
        </div>

        <div className="court-info-box">
          <span className="court-info-label">
            Duración
          </span>

          <p>1 hora y 30 minutos</p>
        </div>
      </div>

      <div className="court-schedules-section">
        <h2 className="schedules-title">
          Elegí tu día y horario
        </h2>

        <p className="schedules-helper">
          Primero seleccioná un día y después un
          bloque disponible.
        </p>

        {message && (
          <p role="status">
            {message}
          </p>
        )}

        <div className="date-picker-wrapper">
          <label
            htmlFor="reservation-date"
            className="date-picker-label"
          >
            Día
          </label>

          <input
            id="reservation-date"
            type="date"
            className="date-picker-input"
            value={selectedDate}
            min={getLocalDateString()}
            onChange={(event) => {
              setAvailabilityStatus('loading');
              setConfirmedSchedules([]);
              setSelectedDate(event.target.value);
              setMessage('');
            }}
          />
        </div>

        {availabilityStatus === 'loading' && (
          <p
            role="status"
            style={{
              padding: '14px',
              marginTop: '16px',
            }}
          >
            Verificando disponibilidad de horarios...
          </p>
        )}

        {availabilityStatus === 'error' && (
          <div
            role="alert"
            style={{
              padding: '16px',
              margin: '16px 0',
              borderRadius: '10px',
              background: '#fff7ed',
              color: '#9a3412',
              border: '1px solid #fed7aa',
            }}
          >
            <strong>
              Reservas temporalmente no disponibles.
            </strong>

            <p style={{ marginTop: '8px' }}>
              No pudimos consultar los turnos ocupados.
              Para evitar reservas duplicadas, los
              horarios permanecerán bloqueados
              hasta recuperar la conexión.
            </p>
          </div>
        )}

        <div className="schedule-bubbles">
          {SCHEDULES.map((schedule) => {
            const confirmed =
              confirmedSchedules.includes(schedule);

            const past = isPastSchedule(
              selectedDate,
              schedule
            );

            const inCart = isSlotInCart(
              String(court.clubId),
              court.courtId,
              selectedDate,
              schedule
            );

            const canCheckAvailability =
              availabilityStatus === 'ready';

            let statusText = 'Disponible';
            let statusClass = 'available';
            let isDisabled = false;

            if (!canCheckAvailability) {
              statusText =
                availabilityStatus === 'loading'
                  ? 'Verificando...'
                  : 'Sin verificar';

              statusClass = 'unavailable';
              isDisabled = true;
            } else if (confirmed || past) {
              statusText = 'No disponible';
              statusClass = 'unavailable';
              isDisabled = true;
            } else if (inCart) {
              statusText = 'Ya lo elegiste';
              statusClass = 'selected';
              isDisabled = true;
            }

            return (
              <button
                type="button"
                key={`${selectedDate}-${schedule}`}
                className={
                  `schedule-bubble ${statusClass}`
                }
                disabled={isDisabled}
                onClick={() => handleReserve(schedule)}
              >
                <span className="schedule-time">
                  {schedule}
                </span>

                <span className="schedule-status">
                  {statusText}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="detail-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={handleGoBack}
        >
          ← Volver
        </button>
      </div>
    </section>
  );
}

export default CourtDetail;
