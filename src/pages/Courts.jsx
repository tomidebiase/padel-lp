
import { Link, useParams } from 'react-router-dom';
import './Courts.css';

const clubs = [
  {
    id: 1,
    name: 'Padel Center La Plata',
    location: 'La Plata',
    image:
      'https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1600&q=85',
    description:
      'Explorá las canchas y conocé la experiencia de PadelLP en La Plata.',
  },
  {
    id: 2,
    name: 'Arena Padel City Bell',
    location: 'City Bell',
    image:
      'https://images.unsplash.com/photo-1709587824751-dd30420f5cf3?auto=format&fit=crop&w=1600&q=85',
    description:
      'Descubrí las opciones de canchas para tu próximo partido en City Bell.',
  },
  {
    id: 3,
    name: 'Gonnet Padel Club',
    location: 'Gonnet',
    image:
      'https://images.unsplash.com/photo-1709587824645-cf6dd2041e2b?auto=format&fit=crop&w=1600&q=85',
    description:
      'Recorré las canchas y descubrí cómo sería organizar tu partido en Gonnet.',
  },
];

const courtPhotos = [
  'https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1709587824751-dd30420f5cf3?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1709587824645-cf6dd2041e2b?auto=format&fit=crop&w=1000&q=85',
];

function Courts() {
  const { id } = useParams();

  const selectedClub = clubs.find(
    (club) => club.id === Number(id)
  );

  if (!selectedClub) {
    return (
      <section className="pl-courts-page">
        <div className="pl-courts-not-found">
          <h1>Club no encontrado</h1>
          <p>No pudimos encontrar el club que buscás.</p>

          <Link to="/clubes" className="pl-courts-button">
            Volver a clubes →
          </Link>
        </div>
      </section>
    );
  }

  const courts = Array.from(
    { length: 4 },
    (_, index) => ({
      id: String((selectedClub.id - 1) * 4 + index + 1),
      name: `Cancha ${index + 1}`,
      number: String(index + 1).padStart(2, '0'),
      image: courtPhotos[
        (selectedClub.id + index - 1) % courtPhotos.length
      ],
      price: 40000,
    })
  );

  return (
    <section className="pl-courts-page">
      <div className="pl-courts-breadcrumb">
        <Link to="/clubes">Clubes</Link>
        <span>/</span>
        <span>{selectedClub.name}</span>
      </div>

      <div className="pl-courts-hero">
        <img
          src={selectedClub.image}
          alt=""
          aria-hidden="true"
          className="pl-courts-hero-image"
        />

        <div className="pl-courts-hero-overlay" />

        <div className="pl-courts-hero-content">
          <span className="pl-courts-eyebrow">
            PADELLP / EXPERIENCIA DE CLUB
          </span>

          <h1>{selectedClub.name}</h1>

          <p>{selectedClub.description}</p>

          <div className="pl-courts-hero-tags">
            <span>⌖ {selectedClub.location}</span>
            <span>4 canchas</span>
            <span>Versión demo</span>
          </div>
        </div>

        <div className="pl-courts-hero-index">
          <strong>
            {String(selectedClub.id).padStart(2, '0')}
          </strong>
          <span>/ 03 CLUBES</span>
        </div>
      </div>

      <div className="pl-courts-heading">
        <div>
          <span className="pl-courts-overline">
            ENCONTRÁ TU CANCHA
          </span>

          <h2>Elegí dónde jugar.</h2>

          <p>
            Conocé las cuatro canchas de este club
            y explorá el calendario de cada una.
          </p>
        </div>

        <div className="pl-courts-heading-count">
          <strong>04</strong>
          <span>CANCHAS</span>
        </div>
      </div>

      <div className="pl-courts-grid">
        {courts.map((court) => (
          <article
            key={court.id}
            className="pl-courts-card"
          >
            <div className="pl-courts-card-image-area">
              <img
                src={court.image}
                alt="Fotografía ilustrativa de una cancha de pádel"
                loading="lazy"
              />

              <span className="pl-courts-card-number">
                CANCHA {court.number}
              </span>

              <span className="pl-courts-card-label">
                DEMO
              </span>
            </div>

            <div className="pl-courts-card-content">
              <div className="pl-courts-card-topline">
                <span>
                  ⌖ {selectedClub.location}
                </span>

                <span>90 MIN</span>
              </div>

              <h3>{court.name}</h3>

              <p>
                Explorá los horarios y conocé
                la experiencia de esta cancha.
              </p>

              <div className="pl-courts-card-bottom">
                <div className="pl-courts-price">
                  <span>PRECIO POR TURNO</span>

                  <strong>
                    ${court.price.toLocaleString('es-AR')}
                  </strong>
                </div>

                <Link
                  to={`/cancha/${court.id}`}
                  className="pl-courts-button"
                >
                  Ver cancha
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <p className="pl-courts-photo-note">
        Imágenes ilustrativas: no representan
        necesariamente las instalaciones reales
        de los clubes.
      </p>

      <div className="pl-courts-footer-banner">
        <div>
          <span>PADELLP · ENCONTRÁ TU PARTIDO</span>

          <h2>El próximo punto empieza acá.</h2>

          <p>
            Seguí explorando clubes o descubrí
            nuestro catálogo de productos.
          </p>
        </div>

        <Link to="/productos">
          Ver productos ↗
        </Link>
      </div>
    </section>
  );
}

export default Courts;
