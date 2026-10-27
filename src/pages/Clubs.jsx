
import { Link } from 'react-router-dom';
import './Clubs.css';

const clubs = [
  {
    id: 1,
    name: 'Padel Center La Plata',
    location: 'La Plata',
    courts: 4,
    image:
      'https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1200&q=85',
    tag: 'La Plata',
  },
  {
    id: 2,
    name: 'Arena Padel City Bell',
    location: 'City Bell',
    courts: 4,
    image:
      'https://images.unsplash.com/photo-1709587824751-dd30420f5cf3?auto=format&fit=crop&w=1200&q=85',
    tag: 'City Bell',
  },
  {
    id: 3,
    name: 'Gonnet Padel Club',
    location: 'Gonnet',
    courts: 4,
    image:
      'https://images.unsplash.com/photo-1709587824645-cf6dd2041e2b?auto=format&fit=crop&w=1200&q=85',
    tag: 'Gonnet',
  },
];

function Clubs() {
  return (
    <section className="pl-clubs-page">
      <div className="pl-clubs-hero">
        <img
          className="pl-clubs-hero-image"
          src="https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1800&q=85"
          alt=""
          aria-hidden="true"
        />

        <div className="pl-clubs-hero-overlay" />

        <div className="pl-clubs-hero-content">
          <span className="pl-clubs-eyebrow">
            PADELLP / EXPLORÁ LOS CLUBES
          </span>

          <h1>
            Tu próxima cancha
            <br />
            te está esperando.
          </h1>

          <p>
            Conocé los clubes de pádel de La Plata,
            City Bell y Gonnet. Explorá sus canchas,
            equipamiento y horarios.
          </p>

          <a
            href="#clubes-disponibles"
            className="pl-clubs-hero-button"
          >
            Explorar clubes
            <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="pl-clubs-hero-counter">
          <strong>03</strong>
          <span>Clubes de muestra</span>
        </div>
      </div>

      <div
        className="pl-clubs-content"
        id="clubes-disponibles"
      >
        <div className="pl-clubs-section-top">
          <div>
            <span className="pl-clubs-section-label">
              ENCONTRÁ TU LUGAR
            </span>

            <h2>Explorá nuestros clubes</h2>

            <p>
              Elegí una ubicación y descubrí sus
              canchas disponibles en la demostración.
            </p>
          </div>

          <div className="pl-clubs-count">
            <strong>03</strong>
            <span>clubes</span>
          </div>
        </div>

        <div className="pl-clubs-grid">
          {clubs.map((club) => (
            <article
              className="pl-club-card"
              key={club.id}
            >
              <div className="pl-club-card-image-wrap">
                <img
                  className="pl-club-card-image"
                  src={club.image}
                  alt="Imagen ilustrativa de una cancha de pádel"
                  loading="lazy"
                />

                <span className="pl-club-image-tag">
                  {club.tag}
                </span>
              </div>

              <div className="pl-club-card-body">
                <div className="pl-club-location">
                  <span aria-hidden="true">●</span>
                  Buenos Aires · {club.location}
                </div>

                <h3>{club.name}</h3>

                <p className="pl-club-description">
                  Conocé las instalaciones y explorá
                  las opciones para tu próximo partido.
                </p>

                <div className="pl-club-details">
                  <div className="pl-club-detail-item">
                    <span
                      className="pl-club-detail-icon"
                      aria-hidden="true"
                    >
                      ◫
                    </span>

                    <span>
                      {club.courts} canchas
                    </span>
                  </div>

                  <span className="pl-club-demo-label">
                    DEMO
                  </span>
                </div>

                <Link
                  to={`/club/${club.id}`}
                  className="pl-club-card-button"
                >
                  Ver canchas

                  <span aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="pl-clubs-photo-note">
          Las fotografías son ilustrativas y no
          representan necesariamente las instalaciones
          reales de los clubes.
        </p>
      </div>

      <div className="pl-clubs-bottom">
        <div>
          <span className="pl-clubs-bottom-label">
            PADELLP EXPERIENCE
          </span>

          <h2>El pádel empieza con un buen partido.</h2>

          <p>
            Descubrí clubes, recorré sus canchas y
            explorá una nueva forma de organizar tus
            partidos.
          </p>
        </div>

        <Link
          to="/productos"
          className="pl-clubs-bottom-button"
        >
          Explorar productos
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </section>
  );
}

export default Clubs;
