export const SERVICE_HOURS = {
  start: 9,   // 09:00
  end: 23,    // 23:00
};

export function isWithinServiceHours() {
  const now = new Date();
  const currentHour = now.getHours();

  return currentHour >= SERVICE_HOURS.start && currentHour < SERVICE_HOURS.end;
}

export function getServiceHoursText() {
  return `Horario de atención para verificar pagos: ${String(
    SERVICE_HOURS.start
  ).padStart(2, '0')}:00 a ${String(SERVICE_HOURS.end).padStart(2, '0')}:00`;
}