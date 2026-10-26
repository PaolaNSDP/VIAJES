import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Ambiente, TipoViaje, Viaje } from '@/data/types';
import { diasDelViaje, diaSemana, fechaLarga } from '@/lib/fechas';

import { geocodificar, type Coordenadas } from './fuentes/geo';
import {
  ambientesDe,
  buscarEnOsm,
  diasMercado,
  encajaCon,
  enlaceMapa,
  esCultura,
  esMercado,
  esSitioDeComer,
  puntuarComer,
  puntuarCultura,
  resumenComer,
  tipoCultura,
  type Lugar,
} from './fuentes/osm';
import { buscarEnTicketmaster, claveTicketmaster } from './fuentes/ticketmaster';
import { descripcionesWikidata } from './fuentes/wikidata';

/**
 * Sugerencias y eventos del destino, con fuentes gratuitas:
 * - OpenStreetMap (Overpass): restaurantes, cultura y mercadillos con su horario.
 * - Wikidata: descripción corta de cada visita cultural.
 * - Ticketmaster: partidos, conciertos y espectáculos en las fechas del viaje (si hay clave).
 * Los resultados se guardan en el dispositivo para no repetir consultas.
 */

export type Restaurante = {
  id: string;
  nombre: string;
  zona: string;
  resumen: string;
  ambientes: Ambiente[];
  enlace: string;
};

export type VisitaCultural = { id: string; nombre: string; tipo: string; descripcion: string; enlace: string };

export const CATEGORIAS_EVENTO = ['Deporte', 'Música', 'Espectáculos', 'Mercadillo', 'Otros'] as const;
export type CategoriaEvento = (typeof CATEGORIAS_EVENTO)[number];

export type Evento = {
  nombre: string;
  categoria: CategoriaEvento;
  zona: string;
  detalle: string;
  /** Fecha concreta del evento. */
  fecha: string;
  cuando: string;
  enlace: string;
};

const DIA_MS = 864e5;

async function conCache<T>(clave: string, duracionMs: number, cargar: () => Promise<T>): Promise<T> {
  try {
    const guardado = await AsyncStorage.getItem(clave);
    if (guardado) {
      const { hasta, valor } = JSON.parse(guardado) as { hasta: number; valor: T };
      if (hasta > Date.now()) return valor;
    }
  } catch {}
  const valor = await cargar();
  AsyncStorage.setItem(clave, JSON.stringify({ hasta: Date.now() + duracionMs, valor })).catch(() => {});
  return valor;
}

const claveDestino = (v: Viaje) => `${v.destino}|${v.pais}`.trim().toLowerCase();

function coordenadas(v: Viaje): Promise<Coordenadas> {
  return conCache(`geo:${claveDestino(v)}`, 90 * DIA_MS, async () => {
    const c = await geocodificar(v.destino, v.pais);
    if (!c) throw new Error(`No encuentro "${v.destino}" en el mapa. Revisa cómo está escrito el destino.`);
    return c;
  });
}

function lugares(v: Viaje): Promise<Lugar[]> {
  return conCache(`osm:${claveDestino(v)}`, 7 * DIA_MS, async () => {
    const { lat, lon } = await coordenadas(v);
    return buscarEnOsm(lat, lon);
  });
}

const zonaDe = (l: Lugar) => l.tags['addr:suburb'] ?? l.tags['addr:neighbourhood'] ?? l.tags['addr:street'] ?? '';

export async function buscarRestaurantes(viaje: Viaje, tipo: TipoViaje, ambiente: Ambiente | null): Promise<Restaurante[]> {
  const pais = (await coordenadas(viaje)).pais || viaje.pais;
  return (await lugares(viaje))
    .filter(esSitioDeComer)
    .filter((l) => !ambiente || ambientesDe(l, pais).includes(ambiente))
    .map((l) => ({ l, p: puntuarComer(l, pais, tipo, ambiente) + (encajaCon(l).includes(tipo) ? 0 : -2) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 20)
    .map(({ l }) => ({ id: l.id, nombre: l.nombre, zona: zonaDe(l), resumen: resumenComer(l), ambientes: ambientesDe(l, pais), enlace: enlaceMapa(l.nombre, viaje.destino) }));
}

export async function buscarCultura(viaje: Viaje): Promise<VisitaCultural[]> {
  const mejores = (await lugares(viaje))
    .filter(esCultura)
    .sort((a, b) => puntuarCultura(b) - puntuarCultura(a))
    .slice(0, 20);
  const descripciones = await conCache(`wd:${claveDestino(viaje)}`, 30 * DIA_MS, () =>
    descripcionesWikidata(mejores.map((l) => l.tags.wikidata).filter(Boolean)),
  ).catch(() => ({}) as Record<string, string>);
  return mejores.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    tipo: tipoCultura(l),
    descripcion: descripciones[l.tags.wikidata] ?? l.tags.description ?? '',
    enlace: l.tags.website ?? enlaceMapa(l.nombre, viaje.destino),
  }));
}

/** Eventos en las fechas del viaje: mercadillos según su horario y, si hay clave, Ticketmaster. */
export async function buscarEventos(viaje: Viaje): Promise<{ eventos: Evento[]; avisos: string[] }> {
  const dias = diasDelViaje(viaje.inicio, viaje.fin);
  const eventos: Evento[] = [];
  const avisos: string[] = [];

  const [osm, tm] = await Promise.allSettled([
    lugares(viaje),
    claveTicketmaster
      ? conCache(`tm:${claveDestino(viaje)}|${viaje.inicio}|${viaje.fin}`, DIA_MS, async () => {
          const { lat, lon } = await coordenadas(viaje);
          return buscarEnTicketmaster(lat, lon, viaje.inicio, viaje.fin);
        })
      : Promise.resolve([]),
  ]);

  if (osm.status === 'fulfilled') {
    for (const m of osm.value.filter(esMercado)) {
      const abre = diasMercado(m);
      // Los mercados que abren a diario son mercados de abastos, no mercadillos de un día concreto.
      if (!abre || abre.length > 3) continue;
      for (const d of dias)
        if (abre.includes(diaSemana(d)))
          eventos.push({ nombre: m.nombre, categoria: 'Mercadillo', zona: zonaDe(m), detalle: `Horario: ${m.tags.opening_hours}`, fecha: d, cuando: fechaLarga(d), enlace: enlaceMapa(m.nombre, viaje.destino) });
    }
  } else avisos.push('No se han podido cargar los mercadillos de OpenStreetMap.');

  if (tm.status === 'fulfilled')
    for (const e of tm.value)
      eventos.push({ nombre: e.nombre, categoria: e.categoria, zona: e.lugar, detalle: e.hora ? `A las ${e.hora}` : '', fecha: e.fecha, cuando: fechaLarga(e.fecha), enlace: e.enlace });
  else avisos.push('No se han podido cargar los partidos y conciertos de Ticketmaster.');
  if (!claveTicketmaster) avisos.push('Partidos, conciertos y espectáculos aparecerán cuando se añada la clave de Ticketmaster.');

  eventos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { eventos, avisos };
}
