import { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { getReservationsByCourt } from '../firebase/reservations';

const courtsData = [
  {
    id: '1',
    clubId: '1',
    clubName: 'Padel Center La Plata',
    courtId: 'cancha-1',
    name: 'Cancha 1',
    location: 'La Plata',
    price: 40000,
  },
  {
    id: '2',
    clubId: '1',
    clubName: 'Padel Center La Plata',
    courtId: 'cancha-2',
    name: 'Cancha 2',
    location: 'La Plata',
    price: 40000,
  },
  {
    id: '3',
    clubId: '1',
    clubName: 'Padel Center La Plata',
    courtId: 'cancha-3',
    name: 'Cancha 3',
    location: 'La Plata',
    price: 40000,
  },
  {
    id: '4',
    clubId: '1',
    clubName: 'Padel Center La Plata',
    courtId: 'cancha-4',
    name: 'Cancha 4',
    location: 'La Plata',
    price: 40000,
  },
  {
    id: '5',
    clubId: '2',
    clubName: 'Arena Padel City Bell',
    courtId: 'cancha-1',
    name: 'Cancha 1',
    location: 'City Bell',
    price: 40000,
  },
  {
    id: '6',
    clubId: '2',
    clubName: 'Arena Padel City Bell',
    courtId: 'cancha-2',
    name: 'Cancha 2',
    location: 'City Bell',
    price: 40000,
  },
  {
    id: '7',
    clubId: '2',
    clubName: 'Arena Padel City Bell',
    courtId: 'cancha-3',
    name: 'Cancha 3',
    location: 'City Bell',
    price: 40000,
  },
  {
    id: '8',
    clubId: '2',
    clubName: 'Arena Padel City Bell',
    courtId: 'cancha-4',
    name: 'Cancha 4',
    location: 'City Bell',
    price: 40000,
  },
  {
    id: '9',
    clubId: '3',
    clubName: 'Gonnet Padel Club',
    courtId: 'cancha-1',
    name: 'Cancha 1',
    location: 'Gonnet',
    price: 40000,
  },
  {
    id: '10',
    clubId: '3',
    clubName: 'Gonnet Padel Club',
    courtId: 'cancha-2',
    name: 'Cancha 2',
    location: 'Gonnet',
    price: 40000,
  },
  {
    id: '11',
    clubId: '3',
    clubName: 'Gonnet Padel Club',
    courtId: 'cancha-3',
    name: 'Cancha 3',
    location: 'Gonnet',
    price: 40000,
  },
  {
    id: '12',
    clubId: '3',
    clubName: 'Gonnet Padel Club',
    courtId: 'cancha-4',
    name: 'Cancha 4',
    location: 'Gonnet',
    price: 40000,
  },
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function CourtDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addToCart, isSlotInCart } = useContext(CartContext);

  const [confirmedSchedules, setConfirmedSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [message, setMessage] = useState('');

  const court = courtsData.find((item) => item.id === id);

  const handleGoBack = () => navigate(-1);

  const generateSchedules = () => {
    const schedules = [];
    let hour = 10;
    let minute = 0;

    while (hour < 22) {
      const start = `${hour.toString().padStart(2, '0')}:${minute
        .toString()
        .padStart(2, '0')}`;

      let endHour = hour;
      let endMinute = minute + 30;

      if (endMinute >= 60) {
        endMinute -= 60;
        endHour += 1;
      }

      endHour += 1;

      const end = `${endHour.toString().padStart(2, '0')}:${endMinute
        .toString()
        .padStart(2, '0')}`;

      schedules.push(`${start} - ${end}`);

      hour = endHour;
      minute = endMinute;
    }

    return schedules;
  };

  const isPastSchedule = (dateString, schedule) => {
    const today = new Date();
    const todayLocalString = getLocalDateString(today);

    if (dateString !== todayLocalString) {
      return false;
    }

    const [startTime] = schedule.split(' - ');
    const [hours, minutes] = startTime.split(':').map(Number);

    const scheduleStart = new Date(today);
    scheduleStart.setHours(hours, minutes, 0, 0);

    return scheduleStart <= today;
  };

  useEffect(() => {
    const fetchReservations = async () => {
      if (!court) return;

      try {
        const reservations = await getReservationsByCourt(
          String(court.clubId),
          court.courtId,
          selectedDate
        );

        const schedules = reservations.map((reservation) => reservation.schedule);
        setConfirmedSchedules(schedules);
      } catch (error) {
        console.error('Error al obtener reservas:', error);
        setConfirmedSchedules([]);
      }
    };

    fetchReservations();
  }, [court, selectedDate]);

  if (!court) {
    return (
      <section>
        <h1>Cancha no encontrada</h1>
        <div className="detail-actions">
          <button className="secondary-button" onClick={handleGoBack}>
            ← Volver
          </button>
        </div>
      </section>
    );
  }

  const schedules = generateSchedules();

  const handleReserve = (schedule) => {
    setMessage('');

    if (confirmedSchedules.includes(schedule)) {
      setMessage('Ese horario ya no está disponible');
      return;
    }

    if (isPastSchedule(selectedDate, schedule)) {
      setMessage('Ese horario ya pasó y no está disponible');
      return;
    }

    if (isSlotInCart(String(court.clubId), court.courtId, selectedDate, schedule)) {
      setMessage('Ese horario ya lo agregaste al carrito');
      return;
    }

    const result = addToCart({
      reservationId: crypto.randomUUID(),
      clubId: String(court.clubId),
      clubName: court.clubName,
      courtId: court.courtId,
      name: court.name,
      location: court.location,
      date: selectedDate,
      schedule,
      price: court.price,
    });

    if (result.success) {
      setMessage('Horario agregado al carrito');
    } else {
      setMessage(result.message);
    }
  };

  return (
    <section className="court-detail-page">
      <div className="court-detail-header">
        <div className="court-detail-badge">Reserva de turno</div>

        <h1 className="court-title">{court.name}</h1>

        <p className="court-subtitle">
          {court.clubName} · {court.location}
        </p>
      </div>

      <div className="court-info-grid">
        <div className="court-info-box">
          <span className="court-info-label">Precio</span>
          <p>${court.price.toLocaleString()} por turno</p>
        </div>

        <div className="court-info-box">
          <span className="court-info-label">Duración</span>
          <p>1 hora y 30 minutos</p>
        </div>
      </div>

      <div className="court-schedules-section">
        <h2 className="schedules-title">Elegí tu día y horario</h2>
        <p className="schedules-helper">
          Primero seleccioná un día y después un bloque disponible.
        </p>

        {message && <p>{message}</p>}

        <div className="date-picker-wrapper">
          <label htmlFor="reservation-date" className="date-picker-label">
            Día
          </label>

          <input
            id="reservation-date"
            type="date"
            className="date-picker-input"
            value={selectedDate}
            min={getLocalDateString()}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setMessage('');
            }}
          />
        </div>

        <div className="schedule-bubbles">
          {schedules.map((schedule) => {
            const confirmed = confirmedSchedules.includes(schedule);
            const past = isPastSchedule(selectedDate, schedule);
            const inCart = isSlotInCart(
              String(court.clubId),
              court.courtId,
              selectedDate,
              schedule
            );

            let statusText = 'Disponible';
            let statusClass = 'available';
            let isDisabled = false;

            if (confirmed || past) {
              statusText = 'No disponible';
              statusClass = 'unavailable';
              isDisabled = true;
            } else if (inCart) {
              statusText = 'Ya lo elegiste';
              statusClass = 'selected';
            }

            return (
              <button
                type="button"
                key={`${selectedDate}-${schedule}`}
                className={`schedule-bubble ${statusClass}`}
                disabled={isDisabled}
                onClick={() => handleReserve(schedule)}
              >
                <span className="schedule-time">{schedule}</span>
                <span className="schedule-status">{statusText}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="detail-actions">
        <button className="secondary-button" onClick={handleGoBack}>
          ← Volver
        </button>
      </div>
    </section>
  );
}

export default CourtDetail;