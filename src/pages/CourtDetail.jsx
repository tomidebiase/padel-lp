
import {
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useParams,
} from 'react-router-dom';

import { CartContext } from '../context/CartContext';

import {
  getReservationsByCourt,
} from '../firebase/reservations';

import './Courts.css';

const DEMO_MODE = true;

const clubs = [
  {
    clubId: '1',
    clubName: 'Padel Center La Plata',
    location: 'La Plata',
    image:
      'https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1600&q=85',
  },
  {
    clubId: '2',
    clubName: 'Arena Padel City Bell',
    location: 'City Bell',
    image:
      'https://images.unsplash.com/photo-1709587824751-dd30420f5cf3?auto=format&fit=crop&w=1600&q=85',
  },
  {
    clubId: '3',
    clubName: 'Gonnet Padel Club',
    location: 'Gonnet',
    image:
      'https://images.unsplash.com/photo-1709587824645-cf6dd2041e2b?auto=format&fit=crop&w=1600&q=85',
  },
];

const courts = clubs.flatMap(
  (club, clubIndex) =>
    Array.from({ length: 4 }, (_, courtIndex) => ({
      id: String(clubIndex * 4 + courtIndex + 1),
      clubId: club.clubId,
      clubName: club.clubName,
      courtId: `cancha-${courtIndex + 1}`,
      name: `Cancha ${courtIndex + 1}`,
      number: String(courtIndex + 1).padStart(2, '0'),
      location: club.location,
      image: club.image,
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

  if (dateString < today) return true;
  if (dateString > today) return false;

  const [startTime] = schedule.split(' - ');

  const [hours, minutes] = startTime
    .split(':')
    .map(Number);

  const scheduleStart = new Date(now);

  scheduleStart.setHours(hours, minutes, 0, 0);

  return scheduleStart <= now;
}

function CourtDetail() {
  const { id } = useParams();

  const {
    addReservationToCart,
    isSlotInCart,
  } = useContext(CartContext);

  const court = courts.find(
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
  ] = useState(
    DEMO_MODE ? 'demo' : 'loading'
  );

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!court || DEMO_MODE) return;

    let cancelled = false;

    const fetchReservations = async () => {
      setAvailabilityStatus('loading');
      setConfirmedSchedules([]);

      try {
        const reservations = await getReservationsByCourt(
          String(court.clubId),
          court.courtId,
          selectedDate
        );

        if (cancelled) return;

        setConfirmedSchedules(
          reservations.map(
            (reservation) => reservation.schedule
          )
        );

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

    if (!court || DEMO_MODE) {
      return;
    }

    if (availabilityStatus !== 'ready') {
      setMessage(
        'No pudimos confirmar la disponibilidad.'
      );
      return;
    }

    if (selectedDate < getLocalDateString()) {
      setMessage(
        'No podés elegir una fecha anterior a hoy.'
      );
      return;
    }

    if (
      confirmedSchedules.includes(schedule) ||
      isPastSchedule(selectedDate, schedule)
    ) {
      setMessage(
        'Ese horario no está disponible.'
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
        'Ese horario ya está en tu carrito.'
      );
      return;
    }

    try {
      const result = addReservationToCart({
        reservationId: crypto.randomUUID(),
        clubId: String(court.clubId),
        clubName: court.clubName,
        courtId: court.courtId,
        courtName: court.name,
        name: court.name,
        location: court.location,
        date: selectedDate,
        schedule,
        price: court.price,
      });

      if (result?.success === false) {
        setMessage(
          result.message ||
          'No se pudo agregar el horario.'
        );
        return;
      }

      setMessage('Horario agregado al carrito.');
    } catch (error) {
      console.error(
        'Error al agregar reserva:',
        error
      );

      setMessage(
        'No se pudo agregar el turno.'
      );
    }
  };

  if (!court) {
    return (
      <section className="pl-detail-page">
        <div className="pl-courts-not-found">
          <h1>Cancha no encontrada</h1>

          <Link
            to="/clubes"
            className="pl-courts-button"
          >
            Volver a clubes →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pl-detail-page">
      <div className="pl-detail-breadcrumb">
        <Link to="/clubes">Clubes</Link>
        <span>/</span>

        <Link to={`/club/${court.clubId}`}>
          {court.clubName}
        </Link>

        <span>/</span>
        <span>{court.name}</span>
      </div>

      <div className="pl-detail-hero">
        <img
          src={court.image}
          alt=""
          aria-hidden="true"
          className="pl-detail-hero-image"
        />

        <div className="pl-detail-hero-overlay" />

        <div className="pl-detail-hero-content">
          <span className="pl-detail-eyebrow">
            PADELLP / EXPERIENCIA DE CANCHA
          </span>

          <h1>{court.name}</h1>

          <p>
            {court.clubName} · {court.location}
          </p>

          <div className="pl-detail-hero-tags">
            <span>90 MINUTOS</span>
            <span>CANCHA {court.number}</span>
            <span>VERSIÓN DEMO</span>
          </div>
        </div>
      </div>

      <div className="pl-detail-metrics">
        <div className="pl-detail-metric">
          <span className="pl-detail-metric-icon">
            ◫
          </span>

          <div>
            <span>CANCHA</span>
            <strong>{court.name}</strong>
          </div>
        </div>

        <div className="pl-detail-metric">
          <span className="pl-detail-metric-icon">
            ◷
          </span>

          <div>
            <span>DURACIÓN</span>
            <strong>1 h 30 min</strong>
          </div>
        </div>

        <div className="pl-detail-metric">
          <span className="pl-detail-metric-icon">
            $
          </span>

          <div>
            <span>PRECIO POR TURNO</span>

            <strong>
              ${court.price.toLocaleString('es-AR')}
            </strong>
          </div>
        </div>
      </div>

      <div className="pl-detail-layout">
        <div className="pl-detail-main">
          <div className="pl-detail-section-header">
            <span className="pl-detail-overline">
              PLANIFICÁ TU PARTIDO
            </span>

            <h2>Explorá día y horario.</h2>

            <p>
              Navegá el calendario y conocé los
              turnos de 90 minutos de esta cancha.
            </p>
          </div>

          <div className="pl-detail-calendar">
            <div>
              <label htmlFor="reservation-date">
                FECHA DEL PARTIDO
              </label>

              <p>Elegí el día que querés explorar.</p>
            </div>

            <input
              id="reservation-date"
              type="date"
              value={selectedDate}
              min={getLocalDateString()}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setMessage('');

                if (!DEMO_MODE) {
                  setAvailabilityStatus('loading');
                  setConfirmedSchedules([]);
                }
              }}
            />
          </div>

          {message && (
            <p
              className="pl-detail-message"
              role="status"
            >
              {message}
            </p>
          )}

          {DEMO_MODE && (
            <div className="pl-detail-demo-notice">
              <div className="pl-detail-demo-icon">
                i
              </div>

              <div>
                <strong>
                  Sistema de reservas en desarrollo
                </strong>

                <p>
                  Esta es una demostración de PadelLP.
                  Podés explorar el calendario y los
                  horarios, pero las reservas online
                  todavía no están habilitadas.
                </p>
              </div>
            </div>
          )}

          {!DEMO_MODE &&
            availabilityStatus === 'loading' && (
              <div className="pl-detail-demo-notice">
                <div>
                  <strong>
                    Verificando disponibilidad...
                  </strong>

                  <p>
                    Estamos consultando los horarios.
                  </p>
                </div>
              </div>
            )}

          {!DEMO_MODE &&
            availabilityStatus === 'error' && (
              <div
                className="pl-detail-demo-notice"
                role="alert"
              >
                <div>
                  <strong>
                    No se pudo verificar disponibilidad
                  </strong>

                  <p>
                    Para evitar reservas duplicadas,
                    los turnos están bloqueados.
                  </p>
                </div>
              </div>
            )}

          <div className="pl-detail-slots-heading">
            <div>
              <h3>Horarios de la cancha</h3>
              <p>Turnos de 1 hora y 30 minutos</p>
            </div>

            <span>
              {SCHEDULES.length} horarios
            </span>
          </div>

          <div className="pl-detail-slots">
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

              let label = 'Disponible';
              let statusClass = 'available';
              let disabled = false;

              if (DEMO_MODE) {
                label = 'Vista previa';
                statusClass = 'demo';
                disabled = true;
              } else if (
                availabilityStatus !== 'ready'
              ) {
                label = 'Sin verificar';
                statusClass = 'unavailable';
                disabled = true;
              } else if (confirmed || past) {
                label = 'No disponible';
                statusClass = 'unavailable';
                disabled = true;
              } else if (inCart) {
                label = 'Ya lo elegiste';
                statusClass = 'selected';
                disabled = true;
              }

              return (
                <button
                  key={`${selectedDate}-${schedule}`}
                  type="button"
                  className={
                    `pl-detail-slot ${statusClass}`
                  }
                  disabled={disabled}
                  onClick={() => handleReserve(schedule)}
                >
                  <strong>{schedule}</strong>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="pl-detail-sidebar">
          <div className="pl-detail-sidebar-card">
            <span className="pl-detail-overline">
              TU CANCHA
            </span>

            <h3>Detalles del turno</h3>

            <div className="pl-detail-sidebar-row">
              <span>Club</span>
              <strong>{court.clubName}</strong>
            </div>

            <div className="pl-detail-sidebar-row">
              <span>Cancha</span>
              <strong>{court.name}</strong>
            </div>

            <div className="pl-detail-sidebar-row">
              <span>Duración</span>
              <strong>90 minutos</strong>
            </div>

            <div className="pl-detail-sidebar-row">
              <span>Precio</span>

              <strong>
                ${court.price.toLocaleString('es-AR')}
              </strong>
            </div>

            <div className="pl-detail-sidebar-total">
              <span>PRECIO DE REFERENCIA</span>

              <strong>
                ${court.price.toLocaleString('es-AR')}
              </strong>
            </div>

            <div className="pl-detail-sidebar-demo">
              DEMO · RESERVAS NO HABILITADAS
            </div>
          </div>

          <div className="pl-detail-help-card">
            <span>SEGUÍ EXPLORANDO</span>

            <h3>¿Querés ver otras canchas?</h3>

            <p>
              Encontrá más opciones dentro de
              este mismo club.
            </p>

            <Link to={`/club/${court.clubId}`}>
              Ver otras canchas ↗
            </Link>
          </div>
        </aside>
      </div>

      <div className="pl-detail-bottom">
        <Link to={`/club/${court.clubId}`}>
          ← Volver al club
        </Link>

        <span>
          Imágenes ilustrativas de canchas de pádel.
        </span>
      </div>
    </section>
  );
}

export default CourtDetail;
