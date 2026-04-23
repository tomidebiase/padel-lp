import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import {
  getReservationsByClub,
  markReservationAsPaid,
  cancelReservation,
} from '../firebase/reservations';

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

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTomorrowString() {
  const date = new Date();
  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getCurrentMonthString() {
  return getTodayString().slice(0, 7);
}

function getLastNDays(n) {
  const days = [];

  for (let i = n - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    days.push(`${year}-${month}-${day}`);
  }

  return days;
}

function formatShortDate(dateString) {
  if (!dateString) return '';
  const [, month, day] = dateString.split('-');
  return `${day}/${month}`;
}

const STATUS_COLORS = {
  paid: '#22c55e',
  pending_payment: '#f59e0b',
  proof_submitted: '#3b82f6',
  expired: '#ef4444',
  cancelled: '#9ca3af',
};

function AdminReservations() {
  const navigate = useNavigate();

  const storedAdminUser = localStorage.getItem('adminUser');
  const adminUser = storedAdminUser ? JSON.parse(storedAdminUser) : null;

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
  const [message, setMessage] = useState('');
  const [reservationToCancel, setReservationToCancel] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const loadReservations = async () => {
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
      console.error(error);
      setMessage('No se pudieron cargar las reservas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [clubId]);

  const activeReservations = useMemo(() => {
    return reservations.filter((reservation) =>
      ['pending_payment', 'proof_submitted', 'paid'].includes(reservation.status)
    );
  }, [reservations]);

  const historyReservations = useMemo(() => {
    let base = reservations.filter((reservation) =>
      ['cancelled', 'expired'].includes(reservation.status)
    );

    if (historyFilter === 'cancelled') {
      base = base.filter((reservation) => reservation.status === 'cancelled');
    }

    if (historyFilter === 'expired') {
      base = base.filter((reservation) => reservation.status === 'expired');
    }

    return base;
  }, [reservations, historyFilter]);

  const visibleReservationsBase = useMemo(() => {
    return reservationsTab === 'activas' ? activeReservations : historyReservations;
  }, [reservationsTab, activeReservations, historyReservations]);

  const filteredReservations = useMemo(() => {
    const today = getTodayString();
    const tomorrow = getTomorrowString();

    return visibleReservationsBase.filter((reservation) => {
      const reservationDate = normalizeDateString(reservation.date);

      const matchesStatus =
        statusFilter === 'all' ? true : reservation.status === statusFilter;

      const matchesDate = dateFilter ? reservationDate === dateFilter : true;

      const matchesQuickFilter =
        quickFilter === 'all'
          ? true
          : quickFilter === 'pending'
          ? ['pending_payment', 'proof_submitted'].includes(reservation.status)
          : quickFilter === 'today'
          ? reservationDate === today
          : quickFilter === 'tomorrow'
          ? reservationDate === tomorrow
          : true;

      return matchesStatus && matchesDate && matchesQuickFilter;
    });
  }, [visibleReservationsBase, statusFilter, dateFilter, quickFilter]);

  const summary = useMemo(() => {
    return {
      total: filteredReservations.length,
      paid: filteredReservations.filter((item) => item.status === 'paid').length,
      pending: filteredReservations.filter((item) =>
        ['pending_payment', 'proof_submitted'].includes(item.status)
      ).length,
      revenue: filteredReservations
        .filter((item) => item.status === 'paid')
        .reduce((acc, item) => acc + Number(item.price || 0), 0),
    };
  }, [filteredReservations]);

  const dashboardData = useMemo(() => {
    const today = getTodayString();
    const currentMonth = getCurrentMonthString();
    const last7Days = getLastNDays(7);

    const paidReservations = reservations.filter((item) => item.status === 'paid');

    const todayReservations = reservations.filter(
      (item) => normalizeDateString(item.date) === today
    );

    const monthReservations = reservations.filter((item) =>
      normalizeDateString(item.date).startsWith(currentMonth)
    );

    const todayRevenue = paidReservations
      .filter((item) => normalizeDateString(item.date) === today)
      .reduce((acc, item) => acc + Number(item.price || 0), 0);

    const monthRevenue = paidReservations
      .filter((item) => normalizeDateString(item.date).startsWith(currentMonth))
      .reduce((acc, item) => acc + Number(item.price || 0), 0);

    const revenueByDay = last7Days.map((day) => {
      const total = paidReservations
        .filter((item) => normalizeDateString(item.date) === day)
        .reduce((acc, item) => acc + Number(item.price || 0), 0);

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
      value: reservations.filter((item) => item.status === status).length,
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

  const handleMarkAsPaid = async (documentId) => {
    try {
      await markReservationAsPaid(documentId);
      await loadReservations();
    } catch (error) {
      console.error(error);
      setMessage('No se pudo marcar la reserva como pagada.');
    }
  };

  const openCancelModal = (reservation) => {
    setReservationToCancel(reservation);
  };

  const closeCancelModal = () => {
    if (isCancelling) return;
    setReservationToCancel(null);
  };

  const confirmCancelReservation = async () => {
    if (!reservationToCancel?.id) return;

    try {
      setIsCancelling(true);
      await cancelReservation(reservationToCancel.id);
      setReservationToCancel(null);
      await loadReservations();
    } catch (error) {
      console.error(error);
      setMessage('No se pudo cancelar la reserva.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    localStorage.removeItem('adminUser');
    navigate('/admin-login');
  };

  const getWhatsappLink = (reservation) => {
    const cleanPhone = String(reservation.customerPhone || '').replace(/\D/g, '');

    if (!cleanPhone) return null;

    const text = encodeURIComponent(
      `Hola ${reservation.customerName || ''}, te escribimos desde ${clubName} por tu reserva en PadelLP.`
    );

    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const getStatusOptionsForCurrentView = () => {
    if (reservationsTab === 'activas') {
      return [
        { value: 'all', label: 'Todos' },
        { value: 'pending_payment', label: 'Pendiente de pago' },
        { value: 'proof_submitted', label: 'Comprobante enviado' },
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

  if (!adminUser) {
    return (
      <section className="admin-page">
        <div className="checkout-form-card">
          <p>No se encontró una sesión de administrador válida.</p>

          <div className="detail-actions">
            <button
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

  const statusOptions = getStatusOptionsForCurrentView();

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
              className={adminTab === 'reservas' ? 'active' : ''}
              onClick={() => setAdminTab('reservas')}
            >
              Reservas
            </button>

            <button
              type="button"
              className={adminTab === 'estadisticas' ? 'active' : ''}
              onClick={() => setAdminTab('estadisticas')}
            >
              Estadísticas
            </button>
          </div>

          <button className="secondary-button" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {adminTab === 'estadisticas' && (
        <>
          <div className="admin-dashboard-grid">
            <div className="admin-summary-card">
              <span>Ingresos de hoy</span>
              <strong>${dashboardData.todayRevenue.toLocaleString('es-AR')}</strong>
            </div>

            <div className="admin-summary-card">
              <span>Ingresos del mes</span>
              <strong>${dashboardData.monthRevenue.toLocaleString('es-AR')}</strong>
            </div>

            <div className="admin-summary-card">
              <span>Reservas de hoy</span>
              <strong>{dashboardData.todayReservationsCount}</strong>
            </div>

            <div className="admin-summary-card">
              <span>Reservas del mes</span>
              <strong>{dashboardData.monthReservationsCount}</strong>
            </div>
          </div>

          <div className="admin-charts-grid improved">
            <div className="admin-chart-card">
              <div className="admin-chart-header">
                <h2>Ingresos por día</h2>
                <p>Últimos 7 días</p>
              </div>

              <div className="rechart-box">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dashboardData.revenueByDay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [
                        `$${Number(value).toLocaleString('es-AR')}`,
                        'Ingresos',
                      ]}
                    />
                    <Bar dataKey="ingresos" radius={[8, 8, 0, 0]} fill="#4f46e5" />
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
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.reservationsByDay}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [Number(value), 'Reservas']} />
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
                <ResponsiveContainer width="100%" height={320}>
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
                      {dashboardData.statuses.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value), 'Cantidad']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="admin-status-overview">
            {dashboardData.statuses.map((item) => (
              <div key={item.key} className="admin-status-overview-card">
                <span className={`admin-status-dot ${getStatusClass(item.key)}`} />
                <div>
                  <p>{item.name}</p>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {adminTab === 'reservas' && (
        <>
          <div className="admin-subtabs">
            <button
              type="button"
              className={reservationsTab === 'activas' ? 'active' : ''}
              onClick={() => {
                setReservationsTab('activas');
                setHistoryFilter('all');
                setQuickFilter('all');
                setStatusFilter('all');
                setDateFilter('');
              }}
            >
              Activas
            </button>

            <button
              type="button"
              className={reservationsTab === 'historial' ? 'active' : ''}
              onClick={() => {
                setReservationsTab('historial');
                setQuickFilter('all');
                setStatusFilter('all');
                setDateFilter('');
              }}
            >
              Historial
            </button>
          </div>

          {reservationsTab === 'activas' && (
            <div className="admin-subtabs secondary">
              <button
                type="button"
                className={quickFilter === 'all' ? 'active' : ''}
                onClick={() => {
                  setQuickFilter('all');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
              >
                Todas
              </button>

              <button
                type="button"
                className={quickFilter === 'pending' ? 'active' : ''}
                onClick={() => {
                  setQuickFilter('pending');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
              >
                Solo pendientes
              </button>

              <button
                type="button"
                className={quickFilter === 'today' ? 'active' : ''}
                onClick={() => {
                  setQuickFilter('today');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
              >
                Hoy
              </button>

              <button
                type="button"
                className={quickFilter === 'tomorrow' ? 'active' : ''}
                onClick={() => {
                  setQuickFilter('tomorrow');
                  setStatusFilter('all');
                  setDateFilter('');
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
                className={historyFilter === 'all' ? 'active' : ''}
                onClick={() => {
                  setHistoryFilter('all');
                  setQuickFilter('all');
                  setStatusFilter('all');
                }}
              >
                Todas
              </button>

              <button
                type="button"
                className={historyFilter === 'cancelled' ? 'active' : ''}
                onClick={() => {
                  setHistoryFilter('cancelled');
                  setQuickFilter('all');
                  setStatusFilter('all');
                }}
              >
                Canceladas
              </button>

              <button
                type="button"
                className={historyFilter === 'expired' ? 'active' : ''}
                onClick={() => {
                  setHistoryFilter('expired');
                  setQuickFilter('all');
                  setStatusFilter('all');
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
              <strong>${summary.revenue.toLocaleString('es-AR')}</strong>
            </div>
          </div>

          <div className="admin-filters">
            <div className="admin-filter-field">
              <label htmlFor="status-filter">Estado</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-filter-field">
              <label htmlFor="date-filter">Fecha</label>
              <input
                id="date-filter"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="admin-filter-actions">
              <button className="secondary-button" onClick={loadReservations}>
                Actualizar
              </button>

              <button
                className="secondary-button"
                onClick={() => {
                  setQuickFilter('all');
                  setStatusFilter('all');
                  setDateFilter('');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {message && <p className="checkout-message">{message}</p>}

          {isLoading ? (
            <div className="checkout-form-card">
              <p>Cargando reservas...</p>
            </div>
          ) : filteredReservations.length === 0 ? (
            <div className="checkout-form-card">
              <p>No hay reservas para mostrar con esos filtros.</p>
            </div>
          ) : (
            <div className="admin-reservations-list">
              {filteredReservations.map((reservation) => {
                const whatsappLink = getWhatsappLink(reservation);

                return (
                  <article key={reservation.id} className="admin-reservation-card">
                    <div className="admin-reservation-top">
                      <div>
                        <h3>{reservation.courtName || 'Cancha'}</h3>
                        <p>
                          {reservation.date} · {reservation.schedule}
                        </p>
                      </div>

                      <span
                        className={`admin-status-badge ${getStatusClass(
                          reservation.status
                        )}`}
                      >
                        {formatStatus(reservation.status)}
                      </span>
                    </div>

                    <div className="admin-reservation-grid">
                      <div>
                        <span className="admin-label">Cliente</span>
                        <p>{reservation.customerName || 'Sin nombre'}</p>
                      </div>

                      <div>
                        <span className="admin-label">Email</span>
                        <p>{reservation.customerEmail || 'Sin email'}</p>
                      </div>

                      <div>
                        <span className="admin-label">Teléfono</span>
                        <p>{reservation.customerPhone || 'Sin teléfono'}</p>
                      </div>

                      <div>
                        <span className="admin-label">Monto</span>
                        <p>
                          ${Number(reservation.price || 0).toLocaleString('es-AR')}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">Pago</span>
                        <p>
                          {reservation.paymentMethod
                            ? reservation.paymentMethod === 'mp'
                              ? 'Mercado Pago'
                              : 'Transferencia / alias'
                            : 'No registrado'}
                        </p>
                      </div>

                      <div>
                        <span className="admin-label">Estado de pago</span>
                        <p>{formatStatus(reservation.paymentStatus)}</p>
                      </div>
                    </div>

                    <div className="admin-actions">
                      {whatsappLink && (
                        <a
                          className="secondary-button"
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir WhatsApp
                        </a>
                      )}

                      <button
                        className="primary-button"
                        onClick={() => handleMarkAsPaid(reservation.id)}
                        disabled={
                          reservation.status === 'paid' ||
                          reservation.status === 'cancelled' ||
                          reservation.status === 'expired'
                        }
                      >
                        Marcar como pagada
                      </button>

                      <button
                        className="secondary-button"
                        onClick={() => openCancelModal(reservation)}
                        disabled={
                          reservation.status === 'cancelled' ||
                          reservation.status === 'expired'
                        }
                      >
                        Cancelar reserva
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {reservationToCancel && (
        <div className="admin-modal-overlay" onClick={closeCancelModal}>
          <div
            className="admin-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-header">
              <h3>Cancelar reserva</h3>
              <button
                type="button"
                className="admin-modal-close"
                onClick={closeCancelModal}
                disabled={isCancelling}
              >
                ×
              </button>
            </div>

            <div className="admin-modal-body">
              <p>
                ¿Estás seguro que querés cancelar esta reserva?
              </p>

              <div className="admin-modal-reservation-info">
                <p>
                  <strong>Cancha:</strong> {reservationToCancel.courtName || 'Cancha'}
                </p>
                <p>
                  <strong>Cliente:</strong> {reservationToCancel.customerName || 'Sin nombre'}
                </p>
                <p>
                  <strong>Fecha:</strong> {reservationToCancel.date}
                </p>
                <p>
                  <strong>Horario:</strong> {reservationToCancel.schedule}
                </p>
              </div>

              <p className="admin-modal-warning">
                Esta acción la mueve al historial y no se puede deshacer desde el panel.
              </p>
            </div>

            <div className="admin-modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeCancelModal}
                disabled={isCancelling}
              >
                Volver
              </button>

              <button
                type="button"
                className="primary-button danger-button"
                onClick={confirmCancelReservation}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminReservations;