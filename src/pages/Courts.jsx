import { useNavigate, useParams } from 'react-router-dom';
import CourtCard from '../components/CourtCard';

function Courts() {
  const navigate = useNavigate();
  const { id } = useParams();

  const clubs = [
    { id: 1, name: 'Padel Center La Plata', location: 'La Plata' },
    { id: 2, name: 'Arena Padel City Bell', location: 'City Bell' },
    { id: 3, name: 'Gonnet Padel Club', location: 'Gonnet' },
  ];

  const selectedClub = clubs.find((club) => club.id === Number(id));

  const courts = Array.from({ length: 4 }, (_, index) => ({
    id: String((Number(id) - 1) * 4 + (index + 1)),
    clubId: Number(id),
    clubName: selectedClub?.name || '',
    name: `Cancha ${index + 1}`,
    price: 40000,
    location: selectedClub?.location || 'La Plata',
  }));

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <section>
      <h1>
        {selectedClub
          ? `Canchas de ${selectedClub.name}`
          : 'Club no encontrado'}
      </h1>

      <div className="courts-grid">
        {courts.map((court) => (
          <CourtCard key={court.id} court={court} />
        ))}
      </div>

      <div className="detail-actions">
        <button className="secondary-button" onClick={handleGoBack}>
          ← Volver
        </button>
      </div>
    </section>
  );
}

export default Courts;