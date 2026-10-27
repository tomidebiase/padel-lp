
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

import {
  onAuthStateChanged,
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

function ProtectedAdminRoute({ children }) {
  const [accessStatus, setAccessStatus] = useState('checking');

  useEffect(() => {
    let active = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!active) return;

        if (!user) {
          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminUser');

          setAccessStatus('denied');
          return;
        }

        try {
          // Buscar el administrador por su UID.
          const adminReference = doc(
            db,
            'admins',
            user.uid
          );

          const adminSnapshot = await getDoc(
            adminReference
          );

          if (!active) return;

          if (!adminSnapshot.exists()) {
            throw new Error(
              'No existe un perfil de administrador.'
            );
          }

          const adminData = adminSnapshot.data();

          const clubId = String(
            adminData.clubId || ''
          );

          // Validar estado y rol del administrador.
          const isAuthorized =
            adminData.active === true &&
            adminData.role === 'club_admin' &&
            Boolean(CLUB_NAMES[clubId]);

          if (!isAuthorized) {
            throw new Error(
              'El administrador no tiene permisos.'
            );
          }

          // Datos de presentación utilizados
          // por el panel administrativo existente.
          localStorage.setItem(
            'adminUser',
            JSON.stringify({
              uid: user.uid,
              email: user.email,
              clubId,
              clubName: CLUB_NAMES[clubId],
            })
          );

          localStorage.removeItem('adminAuth');

          setAccessStatus('allowed');
        } catch (error) {
          console.error(
            'Error al verificar el administrador:',
            error
          );

          localStorage.removeItem('adminAuth');
          localStorage.removeItem('adminUser');

          if (active) {
            setAccessStatus('denied');
          }

          try {
            await signOut(auth);
          } catch (logoutError) {
            console.error(
              'Error al cerrar sesión:',
              logoutError
            );
          }
        }
      },
      (error) => {
        console.error(
          'Error al comprobar la sesión:',
          error
        );

        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminUser');

        if (active) {
          setAccessStatus('denied');
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  if (accessStatus === 'checking') {
    return (
      <section className="admin-page">
        <div className="checkout-form-card">
          <p>
            Verificando acceso al panel...
          </p>
        </div>
      </section>
    );
  }

  if (accessStatus === 'denied') {
    return (
      <Navigate
        to="/admin-login"
        replace
      />
    );
  }

  return children;
}

export default ProtectedAdminRoute;
