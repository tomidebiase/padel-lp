import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ADMIN_USERS = [
  {
    username: 'padellp',
    password: '1234',
    clubId: '1',
    clubName: 'Padel Center La Plata',
  },
  {
    username: 'arenapadel',
    password: '1234',
    clubId: '2',
    clubName: 'Arena Padel City Bell',
  },
  {
    username: 'gonnetpadel',
    password: '1234',
    clubId: '3',
    clubName: 'Gonnet Padel Club',
  },
];

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage('');

    const username = formData.username.trim();
    const password = formData.password.trim();

    if (!username || !password) {
      setMessage('Completá usuario y contraseña.');
      return;
    }

    const matchedUser = ADMIN_USERS.find(
      (user) => user.username === username && user.password === password
    );

    if (!matchedUser) {
      setMessage('Credenciales incorrectas.');
      return;
    }

    localStorage.setItem('adminAuth', 'true');
    localStorage.setItem(
      'adminUser',
      JSON.stringify({
        username: matchedUser.username,
        clubId: matchedUser.clubId,
        clubName: matchedUser.clubName,
      })
    );

    navigate('/admin');
  };

  return (
    <section className="checkout-page">
      <div className="checkout-card" style={{ maxWidth: '500px' }}>
        <div className="checkout-form-header">
          <h1>Panel Admin</h1>
          <p>Ingresá con la cuenta de tu club</p>
        </div>

        {message && <p className="checkout-message">{message}</p>}

        <form className="checkout-form-card" onSubmit={handleSubmit}>
          <div className="checkout-form-grid">
            <div className="form-field full-width">
              <label htmlFor="username">Usuario</label>
              <input
                id="username"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="detail-actions">
            <button type="submit" className="primary-button">
              Ingresar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AdminLogin;