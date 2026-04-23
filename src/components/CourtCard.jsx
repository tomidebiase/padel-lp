import { Link } from 'react-router-dom';

function CourtCard({ court }) {
  return (
    <article className="court-card">
      <h3>{court.name}</h3>
      <p>Precio: ${court.price}</p>
      <p>Ubicación: {court.location}</p>

      <Link className="card-link" to={`/cancha/${court.id}`}>
        Ver detalle
      </Link>
    </article>
  );
}

export default CourtCard;