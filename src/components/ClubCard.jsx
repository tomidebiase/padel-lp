import { Link } from 'react-router-dom';

function ClubCard({ club }) {
  return (
    <article className="court-card">
      <h3>{club.name}</h3>
      <p>Ubicación: {club.location}</p>

      <Link className="card-link" to={`/club/${club.id}`}>
        Ver canchas
      </Link>
    </article>
  );
}

export default ClubCard;