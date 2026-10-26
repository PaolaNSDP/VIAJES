const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIA_MS = 864e5;

/** Mediodía local, para que el cambio de hora no mueva el día. */
export const aFecha = (iso: string) => new Date(`${iso}T12:00:00`);
export const aIso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const esFechaValida = (iso: string) => /^\d{4}-\d{2}-\d{2}$/.test(iso) && !isNaN(aFecha(iso).getTime());
export const esHoraValida = (h: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(h);

export const fechaLarga = (iso: string) => {
  const d = aFecha(iso);
  return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}`;
};
export const fechaCorta = (iso: string) => {
  const d = aFecha(iso);
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
};

export const diasEntre = (desde: string, hasta: string) => Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / DIA_MS);
export const diasHasta = (iso: string, hoy = new Date()) => diasEntre(aIso(hoy), iso);

/** Todos los días del viaje, ambos incluidos. */
export function diasDelViaje(inicio: string, fin: string): string[] {
  const dias: string[] = [];
  for (let d = aFecha(inicio); d <= aFecha(fin); d = new Date(d.getTime() + DIA_MS)) dias.push(aIso(d));
  return dias;
}

export const diaSemana = (iso: string) => aFecha(iso).getDay();
