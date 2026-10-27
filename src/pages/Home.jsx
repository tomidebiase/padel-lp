
import { Link } from 'react-router-dom';
import './Home.css';

const clubs = [
  {
    id: 1,
    name: 'Padel Center La Plata',
    location: 'La Plata',
    image:
      'https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 2,
    name: 'Arena Padel City Bell',
    location: 'City Bell',
    image:
      'https://images.unsplash.com/photo-1709587824751-dd30420f5cf3?auto=format&fit=crop&w=1200&q=85',
  },
  {
    id: 3,
    name: 'Gonnet Padel Club',
    location: 'Gonnet',
    image:
      'https://images.unsplash.com/photo-1709587824645-cf6dd2041e2b?auto=format&fit=crop&w=1200&q=85',
  },
];

const steps = [
  {
    number: '01',
    icon: '⌖',
    title: 'Explorá los clubes',
    description:
      'Descubrí las ubicaciones disponibles en La Plata, City Bell y Gonnet.',
  },
  {
    number: '02',
    icon: '▦',
    title: 'Elegí una cancha',
    description:
      'Conocé las canchas y recorré los horarios de cada club.',
  },
  {
    number: '03',
    icon: '↗',
    title: 'Descubrí la experiencia',
    description:
      'Explorá cómo funciona la plataforma. Las reservas online están en desarrollo.',
  },
];

const clubContactMessage = encodeURIComponent(
  '¡Hola! Tengo un club de pádel y me interesa conocer PadelLP. Quisiera saber cómo podría sumar mi club a la plataforma.'
);

const clubContactUrl =
  `https://wa.me/5492215064057?text=${clubContactMessage}`;

function Home() {
  return (
    <section className="pl-home">
      {/* PORTADA PRINCIPAL */}
      <div className="pl-home-hero">
        <img
          className="pl-home-hero-image"
          src="https://images.unsplash.com/photo-1658491830143-72808ca237e3?auto=format&fit=crop&w=1800&q=85"
          alt=""
          aria-hidden="true"
        />

        <div className="pl-home-hero-overlay" />

        <div className="pl-home-hero-content">
          <div className="pl-home-eyebrow">
            <span className="pl-home-eyebrow-dot" />
            PADELLP · LA PLATA
          </div>

          <h1>
            Tu próximo
            <br />
            gran partido
            <br />
            <span>empieza acá.</span>
          </h1>

          <p>
            Descubrí clubes, explorá canchas y encontrá
            tu próximo lugar para jugar al pádel.
            Todo en una misma plataforma.
          </p>

          <div className="pl-home-hero-actions">
            <Link
              to="/clubes"
              className="pl-home-hero-primary"
            >
              Explorar clubes
              <span aria-hidden="true">↗</span>
            </Link>

            <Link
              to="/productos"
              className="pl-home-hero-secondary"
            >
              Ver productos
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="pl-home-hero-bottom">
          <div className="pl-home-hero-stat">
            <strong>03</strong>
            <span>Clubes de muestra</span>
          </div>

          <div className="pl-home-hero-stat">
            <strong>12</strong>
            <span>Canchas para explorar</span>
          </div>

          <div className="pl-home-hero-scroll">
            DESCUBRÍ PADELLP
            <span aria-hidden="true">↓</span>
          </div>
        </div>
      </div>

      {/* CLUBES DESTACADOS */}
      <div
        className="pl-home-clubs"
        id="clubes-destacados"
      >
        <div className="pl-home-section-header">
          <div>
            <span className="pl-home-section-eyebrow">
              ENCONTRÁ TU LUGAR
            </span>

            <h2>
              Donde empieza
              <br />
              la próxima partida.
            </h2>

            <p>
              Tres ubicaciones para explorar una
              experiencia de pádel diferente.
            </p>
          </div>

          <Link
            to="/clubes"
            className="pl-home-all-link"
          >
            Ver todos los clubes
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="pl-home-clubs-grid">
          {clubs.map((club, index) => (
            <Link
              to={`/club/${club.id}`}
              className="pl-home-club-card"
              key={club.id}
            >
              <img
                src={club.image}
                alt="Fotografía ilustrativa de una cancha de pádel"
                loading="lazy"
              />

              <div className="pl-home-club-shade" />

              <div className="pl-home-club-top">
                <span>
                  {String(index + 1).padStart(2, '0')}
                  {' / '}03
                </span>

                <span className="pl-home-club-demo">
                  DEMO
                </span>
              </div>

              <div className="pl-home-club-content">
                <div className="pl-home-club-location">
                  <span aria-hidden="true">●</span>
                  {club.location} · Buenos Aires
                </div>

                <h3>{club.name}</h3>

                <div className="pl-home-club-bottom">
                  <span>4 canchas para explorar</span>

                  <span className="pl-home-club-arrow">
                    ↗
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="pl-home-photo-disclaimer">
          Fotografías ilustrativas. No representan
          necesariamente las instalaciones reales
          de los clubes.
        </p>
      </div>

      {/* CÓMO FUNCIONA */}
      <div className="pl-home-steps-section">
        <div className="pl-home-section-header">
          <div>
            <span className="pl-home-section-eyebrow">
              UNA EXPERIENCIA MÁS SIMPLE
            </span>

            <h2>El pádel, a tu manera.</h2>

            <p>
              Una plataforma diseñada para que
              explorar clubes y canchas sea más fácil.
            </p>
          </div>
        </div>

        <div className="pl-home-steps-grid">
          {steps.map((step) => (
            <div
              key={step.number}
              className="pl-home-step"
            >
              <div className="pl-home-step-top">
                <span className="pl-home-step-icon">
                  {step.icon}
                </span>

                <span className="pl-home-step-number">
                  {step.number}
                </span>
              </div>

              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN PRODUCTOS */}
      <div className="pl-home-shop">
        <div className="pl-home-shop-content">
          <span className="pl-home-shop-eyebrow">
            MÁS QUE CANCHAS
          </span>

          <h2>
            Equipate para
            <br />
            dar lo mejor.
          </h2>

          <p>
            Descubrí paletas, pelotas y accesorios
            para acompañarte dentro de la cancha.
          </p>

          <Link
            to="/productos"
            className="pl-home-shop-button"
          >
            Explorar productos
            <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div
          className="pl-home-shop-art"
          aria-hidden="true"
        >
          <span className="pl-home-shop-circle">
            <span>PADEL</span>
            <strong>LP.</strong>
          </span>

          <span className="pl-home-shop-art-label">
            PLAY YOUR GAME
          </span>
        </div>
      </div>

      {/* INVITACIÓN PARA CLUBES */}
      <div className="pl-home-contact">
        <div>
          <span className="pl-home-section-eyebrow">
            PARA CLUBES DE PÁDEL
          </span>

          <h2>
            ¿Tenés un club? Hagamos equipo.
          </h2>

          <p>
            Desarrollamos PadelLP para que
            los clubes puedan mostrar sus canchas y
           gestionar reservas online
            desde una sola plataforma.
          </p>

          <p style={{ marginTop: '12px' }}>
            Si te interesa sumar tu club al proyecto
            o conocer cómo funciona, nos encantaría
            hablar con vos.
          </p>
        </div>

        <a
          href={clubContactUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="pl-home-contact-button"
        >
          Quiero sumar mi club
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}

export default Home;
