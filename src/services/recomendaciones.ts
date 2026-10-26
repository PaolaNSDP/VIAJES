import { diasDelViaje, diaSemana, fechaLarga } from '@/lib/fechas';
import type { Ambiente, TipoViaje, Viaje } from '@/data/types';

/**
 * Recomendaciones y eventos del destino.
 *
 * Ahora devuelve datos de ejemplo para Lisboa y Roma. Las funciones ya son asíncronas
 * para poder sustituirlas por las fuentes reales sin tocar las pantallas:
 * - Restaurantes y cultura: Google Places, ordenados por Claude según ambiente y tipo de viaje.
 * - Eventos: Ticketmaster (deporte, música), PredictHQ (ferias, mercadillos, exposiciones) y búsqueda web.
 */

export type Restaurante = {
  nombre: string;
  zona: string;
  precio: '€' | '€€' | '€€€';
  ambientes: Ambiente[];
  encajaCon: TipoViaje[];
  motivo: string;
};

export type VisitaCultural = { nombre: string; zona: string; duracion: string; motivo: string };

export const CATEGORIAS_EVENTO = ['Deporte', 'Mercadillo', 'Exposición', 'Música'] as const;
export type CategoriaEvento = (typeof CATEGORIAS_EVENTO)[number];

type FuenteEvento = {
  nombre: string;
  categoria: CategoriaEvento;
  zona: string;
  motivo: string;
} & (
  | { diasSemana: number[] } // recurrente: 0 = domingo
  | { fecha: string }
  | { desde: string; hasta: string }
);

export type Evento = {
  nombre: string;
  categoria: CategoriaEvento;
  zona: string;
  motivo: string;
  /** Fecha concreta, o null si dura todo el viaje. */
  fecha: string | null;
  cuando: string;
};

type DatosDestino = { comer: Restaurante[]; cultura: VisitaCultural[]; eventos: FuenteEvento[] };

const EJEMPLOS: Record<string, DatosDestino> = {
  lisboa: {
    comer: [
      { nombre: 'Cervejaria Ramiro', zona: 'Intendente', precio: '€€', ambientes: ['Animado', 'Auténtico/local'], encajaCon: ['Con amigos', 'En familia'], motivo: 'Marisco para compartir en mesas largas y mucho bullicio.' },
      { nombre: 'A Cevicheria', zona: 'Príncipe Real', precio: '€€', ambientes: ['Animado'], encajaCon: ['Con amigos', 'En pareja'], motivo: 'Cocina peruana-portuguesa y ambiente joven.' },
      { nombre: 'Tasca do Chico', zona: 'Bairro Alto', precio: '€', ambientes: ['Auténtico/local', 'Animado'], encajaCon: ['Con amigos', 'Solo/a'], motivo: 'Fado espontáneo con petiscos y vino de la casa.' },
      { nombre: 'Lumi Rooftop', zona: 'Chiado', precio: '€€€', ambientes: ['Con vistas', 'Romántico'], encajaCon: ['En pareja'], motivo: 'Terraza sobre los tejados al atardecer.' },
      { nombre: 'O Trevo', zona: 'Camões', precio: '€', ambientes: ['Económico', 'Auténtico/local'], encajaCon: ['Solo/a', 'Con amigos'], motivo: 'La bifana de toda la vida, de pie en la barra.' },
      { nombre: 'Café Gulbenkian', zona: 'Avenidas Novas', precio: '€€', ambientes: ['Tranquilo'], encajaCon: ['Solo/a', 'En familia', 'De trabajo'], motivo: 'Comida ligera junto al jardín, sin ruido.' },
    ],
    cultura: [
      { nombre: 'Mosteiro dos Jerónimos', zona: 'Belém', duracion: '1 h 30', motivo: 'Joya manuelina. Mejor a primera hora para evitar colas.' },
      { nombre: 'Museu Calouste Gulbenkian', zona: 'Avenidas Novas', duracion: '2 h', motivo: 'Arte de Egipto a Lalique en un edificio con jardín.' },
      { nombre: 'MAAT', zona: 'Belém', duracion: '1 h 30', motivo: 'Arte, arquitectura y tecnología junto al río; la cubierta es mirador.' },
      { nombre: 'Castelo de São Jorge', zona: 'Alfama', duracion: '1 h', motivo: 'Las mejores vistas de la ciudad al atardecer.' },
    ],
    eventos: [
      { nombre: 'Feira da Ladra', categoria: 'Mercadillo', diasSemana: [2, 6], zona: 'Campo de Santa Clara', motivo: 'Rastro histórico: azulejos, vinilos y antigüedades.' },
      { nombre: 'LX Market', categoria: 'Mercadillo', diasSemana: [0], zona: 'LX Factory', motivo: 'Diseño local, segunda mano y comida callejera.' },
      { nombre: 'Partido de Liga Portugal en el Estádio da Luz', categoria: 'Deporte', fecha: '2026-11-15', zona: 'Benfica', motivo: 'Ejemplo: comprobar el calendario oficial.' },
      { nombre: 'Exposición temporal en el Gulbenkian', categoria: 'Exposición', desde: '2026-10-01', hasta: '2027-01-15', zona: 'Avenidas Novas', motivo: 'Ejemplo de exposición en curso durante tus fechas.' },
      { nombre: 'Concierto en el Coliseu dos Recreios', categoria: 'Música', fecha: '2026-11-14', zona: 'Baixa', motivo: 'Ejemplo de concierto.' },
    ],
  },
  roma: {
    comer: [
      { nombre: 'Roscioli', zona: "Campo de' Fiori", precio: '€€€', ambientes: ['Romántico', 'Auténtico/local'], encajaCon: ['En pareja'], motivo: 'Carbonara de referencia y una bodega enorme.' },
      { nombre: 'Da Enzo al 29', zona: 'Trastevere', precio: '€€', ambientes: ['Auténtico/local', 'Animado'], encajaCon: ['En pareja', 'Con amigos'], motivo: 'Trattoria pequeña de cocina romana clásica.' },
      { nombre: 'Armando al Pantheon', zona: 'Centro', precio: '€€', ambientes: ['Tranquilo', 'Auténtico/local'], encajaCon: ['En pareja', 'En familia'], motivo: 'Familiar desde 1961, a un paso del Panteón.' },
      { nombre: 'Terrazza Borromini', zona: 'Piazza Navona', precio: '€€€', ambientes: ['Con vistas', 'Romántico'], encajaCon: ['En pareja'], motivo: 'Cena con la plaza iluminada a tus pies.' },
      { nombre: 'Bonci Pizzarium', zona: 'Prati', precio: '€', ambientes: ['Económico', 'Animado'], encajaCon: ['Con amigos', 'Solo/a'], motivo: 'Pizza al taglio para comer de pie.' },
    ],
    cultura: [
      { nombre: 'Galleria Borghese', zona: 'Villa Borghese', duracion: '2 h', motivo: 'Bernini y Caravaggio. Entrada con reserva obligatoria.' },
      { nombre: 'Coliseo y Foro Romano', zona: 'Monti', duracion: '3 h', motivo: 'Billete combinado; reserva franja horaria.' },
      { nombre: 'Museos Vaticanos', zona: 'Vaticano', duracion: '3 h', motivo: 'Capilla Sixtina incluida. Mejor a primera hora.' },
    ],
    eventos: [
      { nombre: 'Mercatino di Natale', categoria: 'Mercadillo', desde: '2026-11-28', hasta: '2027-01-06', zona: 'Piazza Navona', motivo: 'Mercado navideño con puestos y belenes.' },
      { nombre: 'Mercato di Porta Portese', categoria: 'Mercadillo', diasSemana: [0], zona: 'Trastevere', motivo: 'El gran rastro de los domingos.' },
      { nombre: 'Partido de Serie A en el Olimpico', categoria: 'Deporte', fecha: '2026-12-06', zona: 'Foro Italico', motivo: 'Ejemplo: comprobar el calendario oficial.' },
      { nombre: 'Muestra temporal en el Palazzo delle Esposizioni', categoria: 'Exposición', desde: '2026-10-15', hasta: '2027-02-01', zona: 'Via Nazionale', motivo: 'Ejemplo de exposición en curso.' },
    ],
  },
};

const datosDe = (viaje: Viaje): DatosDestino | undefined => EJEMPLOS[viaje.destino.trim().toLowerCase()];

export async function buscarRestaurantes(viaje: Viaje, tipo: TipoViaje, ambiente: Ambiente | null): Promise<Restaurante[] | null> {
  const datos = datosDe(viaje);
  if (!datos) return null;
  const puntos = (r: Restaurante) => (r.encajaCon.includes(tipo) ? 2 : 0) + (ambiente && r.ambientes.includes(ambiente) ? 3 : 0);
  return datos.comer.filter((r) => !ambiente || r.ambientes.includes(ambiente)).sort((a, b) => puntos(b) - puntos(a));
}

export async function buscarCultura(viaje: Viaje): Promise<VisitaCultural[] | null> {
  return datosDe(viaje)?.cultura ?? null;
}

/** Eventos que caen dentro de las fechas del viaje, ordenados por fecha. */
export async function buscarEventos(viaje: Viaje): Promise<Evento[] | null> {
  const datos = datosDe(viaje);
  if (!datos) return null;
  const dias = diasDelViaje(viaje.inicio, viaje.fin);
  const eventos: Evento[] = [];
  for (const e of datos.eventos) {
    const base = { nombre: e.nombre, categoria: e.categoria, zona: e.zona, motivo: e.motivo };
    if ('diasSemana' in e) {
      for (const d of dias) if (e.diasSemana.includes(diaSemana(d))) eventos.push({ ...base, fecha: d, cuando: fechaLarga(d) });
    } else if ('fecha' in e) {
      if (dias.includes(e.fecha)) eventos.push({ ...base, fecha: e.fecha, cuando: fechaLarga(e.fecha) });
    } else if (e.desde <= viaje.fin && e.hasta >= viaje.inicio) {
      eventos.push({ ...base, fecha: null, cuando: 'Todo tu viaje' });
    }
  }
  return eventos.sort((a, b) => (a.fecha ?? viaje.inicio).localeCompare(b.fecha ?? viaje.inicio));
}
