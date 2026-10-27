
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { auth } from '../firebase/config';
import { getReservationsByClub } from '../firebase/reservations';

function formatStatus(status) {
  switch (status) {
    case 'paid':
      return 'Pagada';
    case 'pending_payment':
      return 'Pendiente de pago';
    case 'proof_submitted':
      return 'Comprobante enviado';
    case 'expired':
      return 'Vencida';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || 'Sin estado';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'paid':
      return 'is-paid';
    case 'pending_payment':
      return 'is-pending';
    case 'proof_submitted':
      return 'is-proof';
    case 'expired':
      return 'is-expired';
    case 'cancelled':
      return 'is-cancelled';
    default:
      return '';
  }
}

function normalizeDateString(dateValue) {
  if (!dateValue) return '';
  return String(dateValue).slice(0, 10);
}

function getDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return getDateString(new Date());
}

function getTomorrowString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  return getDateString(date);
}

function getCurrentMonthString() {
  return getTodayString().slice(0, 7);
}

function getLastNDays(n) {
  const days = [];

  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    days.push(getDateString(date));
  }

  return days;
}

function formatShortDate(dateString) {
  if (!dateString) return '';

  const [, month, day] = dateString.split('-');

  return `${day}/${month}`;
}

function getStoredAdminUser() {
  try {
    const storedUser = localStorage.getItem('adminUser');

    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error('Error al leer los datos del administrador:', error);
    return null;
  }
}

const STATUS_COLORS = {
  paid: '#22c55e',
  pending_payment: '#f59e0b',
  proof_submitted: '#3b82f6',
  expired: '#ef4444',
  cancelled: '#9ca3af',
};

const ACTIVE_STATUSES = [
  'pending_payment',
  'proof_submitted',
  'paid',
];

const PENDING_STATUSES = [
  'pending_payment',
  'proof_submitted',
];

const HISTORY_STATUSES = [
  'cancelled',
  'expired',
];

function AdminReservations() {
  const navigate = useNavigate();

  // El perfil lo verificó previamente ProtectedAdminRoute.
  // Estos datos se usan para presentar el panel.
  // La seguridad de la base de datos depende de Firestore Rules.
  const adminUser = getStoredAdminUser();

  const clubId = adminUser?.clubId || '';
  const clubName = adminUser?.clubName || 'Club';

  const [adminTab, setAdminTab] = useState('reservas');
  const [reservationsTab, setReservationsTab] = useState('activas');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [reservations, setReservations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState('');

  const loadReservations = useCallback(async () => {
    if (!clubId) {
      setReservations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setMessage('');

      const data = await getReservationsByClub(clubId);

      setReservations(data);
    } catch (error) {
      console.error('Error al cargar reservas:', error);

      setMessage(
        'No se pudieron cargar las reservas del club.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  // Reservas activas.
  const activeReservations = useMemo(() => {
    return reservations.filter((reservation) =>
      ACTIVE_STATUSES.includes(reservation.status)
    );
  }, [reservations]);

  // Reservas del historial.
  const historyReservations = useMemo(() => {
    let base = reservations.filter((reservation) =>
      HISTORY_STATUSES.includes(reservation.status)
    );

    if (historyFilter === 'cancelled') {
      base = base.filter(
        (reservation) => reservation.status === 'cancelled'
      );
    }

    if (historyFilter === 'expired') {
      base = base.filter(
        (reservation) => reservation.status === 'expired'
      );
    }

    return base;
  }, [reservations, historyFilter]);

  const visibleReservationsBase = useMemo(() => {
    return reservationsTab === 'activas'
      ? activeReservations
      : historyReservations;
  }, [
    reservationsTab,
    activeReservations,
    historyReservations,
  ]);

  // Aplicar filtros.
  const filteredReservations = useMemo(() => {
    const today = getTodayString();
    const tomorrow = getTomorrowString();

    return visibleReservationsBase.filter((reservation) => {
      const reservationDate = normalizeDateString(
        reservation.date
      );

      const matchesStatus =
        statusFilter === 'all' ||
        reservation.status === statusFilter;

      const matchesDate =
        !dateFilter || reservationDate === dateFilter;

      let matchesQuickFilter = true;

      if (quickFilter === 'pending') {
        matchesQuickFilter = PENDING_STATUSES.includes(
          reservation.status
        );
      }

      if (quickFilter === 'today') {
        matchesQuickFilter = reservationDate === today;
      }

      if (quickFilter === 'tomorrow') {
        matchesQuickFilter = reservationDate === tomorrow;
      }

      return (
        matchesStatus &&
        matchesDate &&
        matchesQuickFilter
      );
    });
  }, [
    visibleReservationsBase,
    statusFilter,
    dateFilter,
    quickFilter,
  ]);

  // Tarjetas de resumen.
  const summary = useMemo(() => {
    return {
      total: filteredReservations.length,

      paid: filteredReservations.filter(
        (item) => item.status === 'paid'
      ).length,

      pending: filteredReservations.filter((item) =>
        PENDING_STATUSES.includes(item.status)
      ).length,

      revenue: filteredReservations
        .filter((item) => item.status === 'paid')
        .reduce(
          (acc, item) => acc + Number(item.price || 0),
          0
        ),
    };
  }, [filteredReservations]);

  // Estadísticas y gráficos.
  const dashboardData = useMemo(() => {
    const today = getTodayString();
    const currentMonth = getCurrentMonthString();
    const last7Days = getLastNDays(7);

    const paidReservations = reservations.filter(
      (item) => item.status === 'paid'
    );

    const todayReservations = reservations.filter(
      (item) => normalizeDateString(item.date) === today
    );

    const monthReservations = reservations.filter((item) =>
      normalizeDateString(item.date).startsWith(currentMonth)
    );

    const todayRevenue = paidReservations
      .filter(
        (item) => normalizeDateString(item.date) === today
      )
      .reduce(
        (acc, item) => acc + Number(item.price || 0),
        0
      );

    const monthRevenue = paidReservations
      .filter((item) =>
        normalizeDateString(item.date).startsWith(currentMonth)
      )
      .reduce(
        (acc, item) => acc + Number(item.price || 0),
        0
      );

    const revenueByDay = last7Days.map((day) => {
      const total = paidReservations
        .filter(
          (item) => normalizeDateString(item.date) === day
        )
        .reduce(
          (acc, item) => acc + Number(item.price || 0),
          0
        );

      return {
        day,
        label: formatShortDate(day),
        ingresos: total,
      };
    });

    const reservationsByDay = last7Days.map((day) => {
      const total = reservations.filter(
        (item) => normalizeDateString(item.date) === day
      ).length;

      return {
        day,
        label: formatShortDate(day),
        reservas: total,
      };
    });

    const statuses = [
      'paid',
      'pending_payment',
      'proof_submitted',
      'expired',
      'cancelled',
    ].map((status) => ({
      key: status,
      name: formatStatus(status),
      value: reservations.filter(
        (item) => item.status === status
      ).length,
      color: STATUS_COLORS[status],
    }));

    return {
      todayReservationsCount: todayReservations.length,
      monthReservationsCount: monthReservations.length,
      todayRevenue,
      monthRevenue,
      revenueByDay,
      reservationsByDay,
      statuses,
    };
  }, [reservations]);

  // Cerrar la sesión REAL de Firebase.
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      setMessage('');

      await signOut(auth);

      // Limpiar los datos antiguos solamente
      // después de cerrar la sesión de Firebase.
      localStorage.removeItem('adminAuth');
      localStorage.removeItem('adminUser');

      navigate('/admin-login', {
        replace: true,
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);

      setMessage(
        'No se pudo cerrar la sesión. Intentá nuevamente.'
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getWhatsappLink = (reservation) => {
    const cleanPhone = String(
      reservation.customerPhone || ''
    ).replace(/\D/g, '');

    if (!cleanPhone) return null;

    const text = encodeURIComponent(
      `Hola ${reservation.customerName || ''}, ` +
      `te escribimos desde ${clubName} ` +
      'por tu reserva en PadelLP.'
    );

    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const getStatusOptionsForCurrentView = () => {
    if (reservationsTab === 'activas') {
      return [
        { value: 'all', label: 'Todos' },
        {
          value: 'pending_payment',
          label: 'Pendiente de pago',
        },
        {
          value: 'proof_submitted',
          label: 'Comprobante enviado',
        },
        { value: 'paid', label: 'Pagada' },
      ];
    }

    if (historyFilter === 'cancelled') {
      return [
        { value: 'all', label: 'Todas' },
        { value: 'cancelled', label: 'Cancelada' },
      ];
    }

    if (historyFilter === 'expired') {
      return [
        { value: 'all', label: 'Todas' },
        { value: 'expired', label: 'Vencida' },
      ];
    }

    return [
      { value: 'all', label: 'Todas' },
      { value: 'cancelled', label: 'Cancelada' },
      { value: 'expired', label: 'Vencida' },
    ];
  };

  const clearFilters = () => {
    setQuickFilter('all');
    setStatusFilter('all');
    setDateFilter('');
  };

  const statusOptions = getStatusOptionsForCurrentView();

  if (!adminUser) {
    return (
      <section className="admin-page">
        <div className="checkout-form-card">
          <p>
            No se encontró una sesión de administrador válida.
          </p>

          <div className="detail-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate('/admin-login')}
            >
              Ir al login
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <div className="admin-header admin-header-top">
        <div>
          <h1>Panel del club</h1>

          <p className="checkout-subtitle">
            Gestioná reservas, pagos y estados de {clubName}.
          </p>
        </div>

        <div className="admin-header-actions">
          <div className="admin-tabs">
            <button
              type="button"
              className={
                adminTab === 'reservas' ? 'active' : ''
              }
              onClick={() => setAdminTab('reservas')}
            >
              Reservas
            </button>

            <button
              type="button"
              className={
                adminTab === 'estadisticas' ? 'active' : ''
              }
              onClick={() => setAdminTab('estadisticas')}
            >
              Estadísticas
            </button>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut
              ? 'Cerrando sesión...'
              : 'Cerrar sesión'}
          </button>
        </div>
      </div>

      {message && (
        <p className="checkout-message" role="alert">
          {message}
        </p>
      )}

      {/* ESTADÍSTICAS */}
      {adminTab === 'estadisticas' && (
        <>
          <div className="admin-dashboard-grid">
            <div className="admin-summary-card">
              <span>Ingresos de hoy</span>

              <strong>
                ${dashboardData.todayRevenue.toLocaleString(
                  'es-AR'
                )}
              </strong>
            </div>

            <div className="admin-summary-card">
              <span>Ingresos del mes</span>

              <strong>
                ${dashboardData.monthRevenue.toLocaleString(
                  'es-AR'
                )}
              </strong>
            </div>

            <div className="admin-summary-card">
              <span>Reservas de hoy</span>

              <strong>
                {dashboardData.todayReservationsCount}
              </strong>
            </div>

            <div className="admin-summary-card">
              <span>Reservas del mes</span>

              <strong>
                {dashboardData.monthReservationsCount}
              </strong>
            </div>
          </div>

          <div className="admin-charts-grid improved">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h2>Ingresos por día</h2>
                <p>Últimos 7 días</p>
              </div>

              <div className="rechart-box">
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart data={dashboardData.revenueByDay}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="label" />

                    <YAxis />

                    <Tooltip
                      formatter={(value) => [
                        `$${Number(value).toLocaleString(
                          'es-AR'
                        )}`,
                        'Ingresos',
                      ]}
                    />

                    <Bar
                      dataKey="ingresos"
                      radius={[8, 8, 0, 0]}
                      fill="#4f46e5"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h2>Reservas por día</h2>
                <p>Últimos 7 días</p>
              </div>

              <div className="rechart-box">
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart
                    data={dashboardData.reservationsByDay}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                    />

                    <XAxis dataKey="label" />

                    <YAxis allowDecimals={false} />

                    <Tooltip
                      formatter={(value) => [
                        Number(value),
                        'Reservas',
                      ]}
                    />

                    <Line
                      type="monotone"
                      dataKey="reservas"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 5 }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-pie-section">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h2>Estados de reservas</h2>

                <p>Distribución general</p>
              </div>

              <div className="rechart-box pie">
                <ResponsiveContainer
                  width="100%"
                  height={320}
                >
                  <PieChart>
                    <Pie
                      data={dashboardData.statuses}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={3}
                    >
                      {dashboardData.statuses.map(
                        (entry) => (
                          <Cell
                            key={entry.key}
                            fill={entry.color}
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip
                      formatter={(value) => [
                        Number(value),
                        'Cantidad',
                      ]}
                    />

                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-status-overview">
            {dashboardData.statuses.map((item) => (
              <div
                key={item.key}
                className="admin-status-overview-card"
              >
                <span
                  className={
                    `admin-status-dot ` +
                    getStatusClass(item.key)
                  }
                />

                <div>
                  <p>{item.name}</p>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* RESERVAS */}
      {adminTab === 'reservas' && (
        <>
          <div className="admin-subtabs">
            <button
              type="button"
              className={
                reservationsTab === 'activas'
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setReservationsTab('activas');
                setHistoryFilter('all');
                clearFilters();
              }}
            >
              Activas
            </button>

            <button
              type="button"
              className={
                reservationsTab === 'historial'
                  ? 'active'
                  : ''
              }
              onClick={() => {
                setReservationsTab('historial');
                clearFilters();
              }}
            >
              Historial
            </button>
          </div>

          {reservationsTab === 'activas' && (
            <div className="admin-subtabs secondary">
              <button
                type="button"
                className={
                  quickFilter === 'all' ? 'active' : ''
                }
                onClick={clearFilters}
              >
                Todas
              </button>

              <button
                type="button"
                className={
                  quickFilter === 'pending' ? 'active' : ''
                }
                onClick={() => {
                  clearFilters();
                  setQuickFilter('pending');
                }}
              >
                Solo pendientes
              </button>

              <button
                type="button"
                className={
                  quickFilter === 'today' ? 'active' : ''
                }
                onClick={() => {
                  clearFilters();
                  setQuickFilter('today');
                }}
              >
                Hoy
              </button>

              <button
                type="button"
                className={
                  quickFilter === 'tomorrow' ? 'active' : ''
                }
                onClick={() => {
                  clearFilters();
                  setQuickFilter('tomorrow');
                }}
              >
                Mañana
              </button>
            </div>
          )}

          {reservationsTab === 'historial' && (
            <div className="admin-subtabs secondary">
              <button
                type="button"
                className={
                  historyFilter === 'all' ? 'active' : ''
                }
                onClick={() => {
                  setHistoryFilter('all');
                  clearFilters();
                }}
              >
                Todas
              </button>

              <button
                type="button"
                className={
                  historyFilter === 'cancelled'
                    ? 'active'
                    : ''
                }
                onClick={() => {
                  setHistoryFilter('cancelled');
                  clearFilters();
                }}
              >
                Canceladas
              </button>

              <button
                type="button"
                className={
                  historyFilter === 'expired' ? 'active' : ''
                }
                onClick={() => {
                  setHistoryFilter('expired');
                  clearFilters();
                }}
              >
                Vencidas
              </button>
            </div>
          )}

          <div className="admin-summary-grid">
            <div className="admin-summary-card">
              <span>
                {reservationsTab === 'activas'
                  ? quickFilter === 'pending'
                    ? 'Pendientes activas'
                    : quickFilter === 'today'
                    ? 'Reservas de hoy'
                    : quickFilter === 'tomorrow'
                    ? 'Reservas de mañana'
                    : 'Reservas activas'
                  : historyFilter === 'cancelled'
                  ? 'Canceladas'
                  : historyFilter === 'expired'
                  ? 'Vencidas'
                  : 'Historial visible'}
              </span>

              <strong>{summary.total}</strong>
            </div>

            <div className="admin-summary-card">
              <span>Pagadas</span>
              <strong>{summary.paid}</strong>
            </div>

            <div className="admin-summary-card">
              <span>Pendientes</span>
              <strong>{summary.pending}</strong>
            </div>

            <div className="admin-summary-card">
              <span>Ingresos cobrados</span>

              <strong>
                ${summary.revenue.toLocaleString('es-AR')}
              </strong>
            </div>
          </div>

          <div className="admin-filters">
            <div className="admin-filter-field">
              <label htmlFor="status-filter">
                Estado
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-filter-field">
              <label htmlFor="date-filter">
                Fecha
              </label>

              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value)
                }
              />
            </div>

            <div className="admin-filter-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={loadReservations}
                disabled={isLoading}
              >
                {isLoading ? 'Cargando...' : 'Actualizar'}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={clearFilters}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {/* Aviso de seguridad para las acciones administrativas */}
          {reservationsTab === 'activas' && (
            <p
              style={{
                fontSize: '13px',
                color: '#64748b',
                margin: '16px 0',
              }}
            >
              La confirmación de pagos y la cancelación de
              reservas están temporalmente deshabilitadas
              mientras completamos la seguridad del sistema.
            </p>
          )}

          {isLoading ? (
            <div className="checkout-form-card">
              <p>Cargando reservas...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="checkout-form-card">
              <p>
                No hay reservas para mostrar con esos filtros.
              </p>
            </div>
          ) : (
            <div className="admin-reservations-list">
              {filteredReservations.map((reservation) => {
                const whatsappLink = getWhatsappLink(
                  reservation
                );

                const isHistoryReservation =
                  HISTORY_STATUSES.includes(
                    reservation.status
                  );

                const canEventuallyMarkPaid =
                  PENDING_STATUSES.includes(
                    reservation.status
                  );

                const canEventuallyCancel =
                  ACTIVE_STATUSES.includes(
                    reservation.status
                  );

                return (
                  <article
                    key={reservation.id}
                    className="admin-reservation-card"
                  >
                    <div className="admin-reservation-top">
                      <div>
                        <h3>
                          {reservation.courtName || 'Cancha'}
                        </h3>

                        <p>
                          {reservation.date} ·{' '}
                          {reservation.schedule}
                        </p>
                      </div>

                      <span
                        className={
                          `admin-status-badge ` +
                          getStatusClass(reservation.status)
                        }
                      >
                        {formatStatus(
                          reservation.status
                        )}
                      </span>
                    </div>

                    <div className="admin-reservation-grid">
                      <div>
                        <span className="admin-label">
                          Cliente
                        </span>

                        <p>
                          {reservation.customerName ||
                            'Sin nombre'}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">
                          Email
                        </span>

                        <p>
                          {reservation.customerEmail ||
                            'Sin email'}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">
                          Teléfono
                        </span>

                        <p>
                          {reservation.customerPhone ||
                            'Sin teléfono'}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">
                          Monto
                        </span>

                        <p>
                          $
                          {Number(
                            reservation.price || 0
                          ).toLocaleString('es-AR')}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">
                          Pago
                        </span>

                        <p>
                          {reservation.paymentMethod
                            ? reservation.paymentMethod ===
                              'mp'
                              ? 'Mercado Pago'
                              : 'Transferencia / alias'
                            : 'No registrado'}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">
                          Estado de pago
                        </span>

                        <p>
                          {formatStatus(
                            reservation.paymentStatus
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="admin-actions">
                      {whatsappLink && (
                        <a
                          className="secondary-button"
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Abrir WhatsApp
                        </a>
                      )}

                      {/* Nunca mostrar acciones de modificación
                          en reservas canceladas o vencidas. */}
                      {!isHistoryReservation && (
                        <>
                          {canEventuallyMarkPaid && (
                            <button
                              type="button"
                              className="primary-button"
                              disabled
                              title="Temporalmente deshabilitado por seguridad"
                            >
                              Marcar como pagada
                            </button>
                          )}

                          {canEventuallyCancel && (
                            <button
                              type="button"
                              className="secondary-button"
                              disabled
                              title="Temporalmente deshabilitado por seguridad"
                            >
                              Cancelar reserva
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default AdminReservations;
