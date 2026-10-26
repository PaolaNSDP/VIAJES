import { CATEGORIAS_GASTO, TIPOS_TRANSPORTE, type ElementoDe, type SeccionEditable } from '@/data/types';
import { diasEntre, fechaCorta, fechaLarga } from '@/lib/fechas';

export type TipoCampo = 'texto' | 'fecha' | 'hora' | 'importe' | 'opcion';

export type DefCampo = {
  clave: string;
  etiqueta: string;
  tipo: TipoCampo;
  opciones?: readonly string[];
  obligatorio?: boolean;
};

type DefSeccion<S extends SeccionEditable> = {
  titulo: string;
  campos: DefCampo[];
  icono: (e: ElementoDe<S>) => string;
  linea1: (e: ElementoDe<S>) => string;
  linea2: (e: ElementoDe<S>) => string;
  orden?: (e: ElementoDe<S>) => string;
};

/** Qué campos tiene cada sección del viaje y cómo se muestra cada elemento en la lista. */
export const SECCIONES: { [S in SeccionEditable]: DefSeccion<S> } = {
  transporte: {
    titulo: 'Transporte',
    campos: [
      { clave: 'tipo', etiqueta: 'Tipo', tipo: 'opcion', opciones: TIPOS_TRANSPORTE },
      { clave: 'codigo', etiqueta: 'Nº vuelo / tren', tipo: 'texto' },
      { clave: 'desde', etiqueta: 'Desde', tipo: 'texto', obligatorio: true },
      { clave: 'hasta', etiqueta: 'Hasta', tipo: 'texto', obligatorio: true },
      { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', obligatorio: true },
      { clave: 'hora', etiqueta: 'Hora', tipo: 'hora' },
      { clave: 'ref', etiqueta: 'Localizador', tipo: 'texto' },
    ],
    icono: (e) => ({ Vuelo: '✈', Tren: 'TR', Autobús: 'BUS', Coche: 'CAR', Ferry: '⛴' })[e.tipo] ?? '•',
    linea1: (e) => `${e.desde} → ${e.hasta}${e.codigo ? `  ·  ${e.codigo}` : ''}`,
    linea2: (e) => [fechaLarga(e.fecha), e.hora, e.ref && `Loc. ${e.ref}`].filter(Boolean).join(' · '),
    orden: (e) => e.fecha + e.hora,
  },
  hoteles: {
    titulo: 'Alojamiento',
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'texto', obligatorio: true },
      { clave: 'direccion', etiqueta: 'Dirección', tipo: 'texto' },
      { clave: 'entrada', etiqueta: 'Entrada', tipo: 'fecha', obligatorio: true },
      { clave: 'salida', etiqueta: 'Salida', tipo: 'fecha', obligatorio: true },
      { clave: 'ref', etiqueta: 'Nº reserva', tipo: 'texto' },
    ],
    icono: () => 'H',
    linea1: (e) => e.nombre,
    linea2: (e) =>
      [e.direccion, `${fechaCorta(e.entrada)} → ${fechaCorta(e.salida)} · ${diasEntre(e.entrada, e.salida)} noches`, e.ref].filter(Boolean).join('\n'),
    orden: (e) => e.entrada,
  },
  itinerario: {
    titulo: 'Itinerario',
    campos: [
      { clave: 'fecha', etiqueta: 'Día', tipo: 'fecha', obligatorio: true },
      { clave: 'hora', etiqueta: 'Hora', tipo: 'hora' },
      { clave: 'plan', etiqueta: 'Plan', tipo: 'texto', obligatorio: true },
    ],
    icono: (e) => e.hora || '—',
    linea1: (e) => e.plan,
    linea2: () => '',
    orden: (e) => e.fecha + e.hora,
  },
  gastos: {
    titulo: 'Gastos',
    campos: [
      { clave: 'concepto', etiqueta: 'Concepto', tipo: 'texto', obligatorio: true },
      { clave: 'categoria', etiqueta: 'Categoría', tipo: 'opcion', opciones: CATEGORIAS_GASTO },
      { clave: 'importe', etiqueta: 'Importe (€)', tipo: 'importe', obligatorio: true },
    ],
    icono: (e) => e.categoria.slice(0, 3).toUpperCase(),
    linea1: (e) => e.concepto,
    linea2: (e) => `${e.categoria} · ${euros(e.importe)}`,
  },
};

export const euros = (n: number) => n.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
