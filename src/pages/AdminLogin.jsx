
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

import {
  doc,
  getDoc,
} from 'firebase/firestore';

import { auth, db } from '../firebase/config';

const CLUB_NAMES = {
  '1': 'Padel Center La Plata',
  '2': 'Arena Padel City Bell',
  '3': 'Gonnet Padel Club',
};

function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Limpiar la sesión administrativa anterior.
  useEffect(() => {
    let active = true;

    const prepareLogin = async () => {
      try {
        await signOut(auth);
      } catch (error) {
        console.error(
          'Error al cerrar la sesión anterior:',
          error
        );
      } finally {
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');

        if (active) {
          setIsReady(true);
        }
      }
    };

    prepareLogin();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLoading || !isReady) {
      return;
    }

    setMessage('');

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      setMessage(
        'Completá el correo electrónico y la contraseña.'
      );
      return;
    }

    setIsLoading(true);

    try {
      // 1. Iniciar sesión con Firebase Authentication.
      const credentials = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = credentials.user;

      // 2. Buscar el perfil del administrador en Firestore.
      const adminReference = doc(
        db,
        'admins',
        user.uid
      );

      const adminSnapshot = await getDoc(adminReference);

      if (!adminSnapshot.exists()) {
        throw new Error('not-authorized');
      }

      const adminData = adminSnapshot.data();
      const clubId = String(adminData.clubId || '');

      // 3. Verificar que la cuenta esté autorizada.
      const isAuthorized =
        adminData.active === true &&
        adminData.role === 'club_admin' &&
        Boolean(CLUB_NAMES[clubId]);

      if (!isAuthorized) {
        throw new Error('not-authorized');
      }

      // 4. Guardar datos para mostrar el panel.
      // La autorización real dependerá de Firebase
      // y de las reglas de seguridad de Firestore.
      localStorage.setItem(
        'adminUser',
        JSON.stringify({
          uid: user.uid,
          email: user.email,
          clubId,
          clubName: CLUB_NAMES[clubId],
        })
      );

      // El sistema antiguo ya no se utiliza.
      localStorage.removeItem('adminAuth');

      // 5. Abrir el panel administrativo.
      navigate('/admin', {
        replace: true,
      });
    } catch (error) {
      console.error(
        'Error al iniciar sesión:',
        error
      );

      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminUser');

      try {
        await signOut(auth);
      } catch (logoutError) {
        console.error(
          'Error al cerrar la sesión:',
          logoutError
        );
      }

      if (error.message === 'not-authorized') {
        setMessage(
          'Esta cuenta no tiene permisos de administrador.'
        );
      } else if (error.code === 'permission-denied') {
        setMessage(
          'No se pudo consultar el perfil de administrador. ' +
          'Revisá las reglas de Firestore.'
        );
      } else if (
        error.code === 'auth/invalid-credential' ||
        error.code === 'auth/wrong-password' ||
        error.code === 'auth/user-not-found' ||
        error.code === 'auth/invalid-email'
      ) {
        setMessage(
          'Correo electrónico o contraseña incorrectos.'
        );
      } else if (error.code === 'auth/too-many-requests') {
        setMessage(
          'Demasiados intentos. Probá nuevamente más tarde.'
        );
      } else {
        setMessage(
          'Ocurrió un error al iniciar sesión. ' +
          'Revisá la consola del navegador.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="checkout-page">
      <div
        className="checkout-card"
        style={{ maxWidth: '500px' }}
      >
        <div className="checkout-form-header">
          <h1>Panel Admin</h1>

          <p>
            Ingresá con la cuenta de administrador de tu club
          </p>
        </div>

        {message && (
          <p
            className="checkout-message"
            role="alert"
          >
            {message}
          </p>
        )}

        <form
          className="checkout-form-card"
          onSubmit={handleSubmit}
        >
          <div className="checkout-form-grid">
            <div className="form-field full-width">
              <label htmlFor="admin-email">
                Correo electrónico
              </label>

              <input
                id="admin-email"
                type="email"
                name="email"
                placeholder="administrador@ejemplo.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="form-field full-width">
              <label htmlFor="admin-password">
                Contraseña
              </label>

              <input
                id="admin-password"
                type="password"
                name="password"
                placeholder="Tu contraseña"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <div className="detail-actions">
            <button
              type="submit"
              className="primary-button"
              disabled={isLoading || !isReady}
            >
              {!isReady
                ? 'Preparando acceso...'
                : isLoading
                ? 'Ingresando...'
                : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default AdminLogin;
