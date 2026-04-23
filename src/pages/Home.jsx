import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="home">
      {/* HERO */}
      <div className="home-hero">
        <div className="home-hero-content">
          <h1>Reservá tu cancha de pádel en segundos</h1>

          <p>
            Elegí tu club, seleccioná horario y confirmá tu reserva online.
            Simple, rápido y sin llamadas.
          </p>

          <Link to="/clubes">
            <button className="primary-button hero-button">
              Ver clubes disponibles
            </button>
          </Link>
        </div>
      </div>

      {/* CLUBES */}
      <div className="checkout-form-card">
        <div className="checkout-form-header">
          <h2>Clubes disponibles</h2>
          <p>Elegí dónde querés jugar</p>
        </div>

        <div className="clubs-grid">
          <div className="club-card">
            <h3>Padel Center La Plata</h3>
            <p>📍 La Plata</p>

            <Link to="/club/1">
              <button className="secondary-button">Ver canchas</button>
            </Link>
          </div>

          <div className="club-card">
            <h3>Arena Padel City Bell</h3>
            <p>📍 City Bell</p>

            <Link to="/club/2">
              <button className="secondary-button">Ver canchas</button>
            </Link>
          </div>

          <div className="club-card">
            <h3>Gonnet Padel Club</h3>
            <p>📍 Gonnet</p>

            <Link to="/club/3">
              <button className="secondary-button">Ver canchas</button>
            </Link>
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <div className="checkout-form-card">
        <div className="checkout-form-header">
          <h2>¿Cómo funciona?</h2>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span>1</span>
            <p>Elegís un club</p>
          </div>

          <div className="step-card">
            <span>2</span>
            <p>Seleccionás día y horario</p>
          </div>

          <div className="step-card">
            <span>3</span>
            <p>Confirmás tu reserva</p>
          </div>
        </div>
      </div>

      {/* SUMAR CLUB */}
      <div className="join-club-section">
        <div className="join-club-content">
          <h2>¿Tenés un club y querés sumarte a PadelLP?</h2>

          <p>
            Ofrecé reservas online para tus canchas, organizá mejor tu agenda y
            recibí pagos de forma más simple.
          </p>

          <a
            href="https://wa.me/5492215064057?text=Hola,%20quiero%20sumar%20mi%20club%20a%20PadelLP"
            target="_blank"
            rel="noreferrer"
          >
            <button className="primary-button join-club-button">
              Contactanos por WhatsApp
            </button>
          </a>
        </div>
      </div>
    </section>
  );
}

export default Home;