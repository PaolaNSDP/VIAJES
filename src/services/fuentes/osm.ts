import type { Ambiente, TipoViaje } from '@/data/types';

import { diasQueAbre } from './horarios';

/** Elemento de OpenStreetMap tal como lo devuelve Overpass con `out center tags`. */
export type ElementoOsm = {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export type Lugar = {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  tags: Record<string, string>;
};

const OVERPASS = 'https://overpass-api.de/api/interpreter';

export function consultaOverpass(lat: number, lon: number) {
  const cerca = `(around:1500,${lat},${lon})`;
  const zona = `(around:7000,${lat},${lon})`;
  return `[out:json][timeout:40];
(nwr["amenity"~"^(restaurant|cafe|bar|pub|fast_food|food_court)$"]["name"]${cerca};)->.comer;
.comer out center tags 500;
(nwr["tourism"~"^(museum|gallery|attraction|viewpoint)$"]["name"]${zona};
 nwr["historic"~"^(castle|monument|palace|ruins|archaeological_site|church|monastery)$"]["name"]["wikidata"]${zona};)->.cultura;
.cultura out center tags 300;
(nwr["amenity"="marketplace"]["name"]${zona};)->.mercados;
.mercados out center tags 60;`;
}

export async function buscarEnOsm(lat: number, lon: number): Promise<Lugar[]> {
  const res = await fetch(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(consultaOverpass(lat, lon)), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error(`OpenStreetMap respondió ${res.status}`);
  const json = (await res.json()) as { elements: ElementoOsm[] };
  return aLugares(json.elements);
}

export function aLugares(elementos: ElementoOsm[]): Lugar[] {
  const vistos = new Set<string>();
  const lugares: Lugar[] = [];
  for (const e of elementos) {
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    const nombre = e.tags?.['name:es'] ?? e.tags?.name;
    if (lat == null || lon == null || !nombre || !e.tags) continue;
    const id = `${e.type}/${e.id}`;
    if (vistos.has(id)) continue;
    vistos.add(id);
    lugares.push({ id, nombre, lat, lon, tags: e.tags });
  }
  return lugares;
}

export const esSitioDeComer = (l: Lugar) => /^(restaurant|cafe|bar|pub|fast_food|food_court)$/.test(l.tags.amenity ?? '');
export const esMercado = (l: Lugar) => l.tags.amenity === 'marketplace';
export const esCultura = (l: Lugar) => !esSitioDeComer(l) && !esMercado(l);

/** Cocinas que cuentan como "local" según el país del viaje. */
const COCINA_LOCAL: Record<string, string[]> = {
  portugal: ['portuguese'],
  españa: ['spanish', 'tapas', 'basque', 'catalan', 'galician', 'andalusian'],
  espana: ['spanish', 'tapas', 'basque', 'catalan', 'galician', 'andalusian'],
  italia: ['italian', 'pizza', 'roman', 'neapolitan', 'sicilian'],
  francia: ['french', 'crepe', 'bistro'],
  grecia: ['greek'],
  alemania: ['german'],
  marruecos: ['moroccan'],
  méxico: ['mexican'],
  mexico: ['mexican'],
  japón: ['japanese', 'sushi', 'ramen'],
  japon: ['japanese', 'sushi', 'ramen'],
  'reino unido': ['british', 'fish_and_chips'],
  irlanda: ['irish'],
  turquía: ['turkish', 'kebab'],
  turquia: ['turkish', 'kebab'],
};

const COCINAS_ES: Record<string, string> = {
  portuguese: 'portuguesa', spanish: 'española', italian: 'italiana', pizza: 'pizza', french: 'francesa', greek: 'griega', japanese: 'japonesa',
  sushi: 'sushi', chinese: 'china', indian: 'india', mexican: 'mexicana', seafood: 'marisco', fish: 'pescado', regional: 'regional',
  tapas: 'tapas', burger: 'hamburguesas', vegetarian: 'vegetariana', vegan: 'vegana', steak_house: 'carnes', coffee_shop: 'café',
  peruvian: 'peruana', thai: 'tailandesa', vietnamese: 'vietnamita', korean: 'coreana', turkish: 'turca', kebab: 'kebab', german: 'alemana',
  british: 'británica', moroccan: 'marroquí', brazilian: 'brasileña', argentinian: 'argentina', international: 'internacional', ice_cream: 'helados',
};

const cocinas = (l: Lugar) => (l.tags.cuisine ?? '').toLowerCase().split(/[;,]/).map((c) => c.trim()).filter(Boolean);
const tieneVistas = (l: Lugar) => l.tags.rooftop === 'yes' || /rooftop|terrace|terraza|terrazza|miradouro|mirador|vista|view|panorama|belvedere/i.test(l.nombre);
const abreTarde = (l: Lugar) => /(0[1-5]|2[4-9]):\d{2}/.test(l.tags.opening_hours ?? '');
const conocido = (l: Lugar) => !!(l.tags.wikidata || l.tags.wikipedia || l.tags.website || l.tags['contact:website']);

/** Ambientes que encajan con un sitio de comer, deducidos de sus etiquetas de OpenStreetMap. */
export function ambientesDe(l: Lugar, pais: string): Ambiente[] {
  const a = new Set<Ambiente>();
  const tipo = l.tags.amenity;
  const c = cocinas(l);
  const locales = [...(COCINA_LOCAL[pais.trim().toLowerCase()] ?? []), 'regional', 'local'];
  if (c.some((x) => locales.includes(x))) a.add('Auténtico/local');
  if (tieneVistas(l)) a.add('Con vistas');
  if (tipo === 'bar' || tipo === 'pub' || c.includes('tapas') || abreTarde(l)) a.add('Animado');
  if (tipo === 'cafe' && !abreTarde(l)) a.add('Tranquilo');
  if (tipo === 'fast_food' || tipo === 'food_court' || c.some((x) => ['kebab', 'sandwich', 'burger', 'pizza', 'bakery'].includes(x))) a.add('Económico');
  if (tipo === 'restaurant' && (tieneVistas(l) || l.tags.outdoor_seating === 'yes' || c.some((x) => ['french', 'wine', 'fine_dining', 'seafood', 'fish'].includes(x)))) a.add('Romántico');
  return [...a];
}

/** Tipos de viaje con los que encaja un sitio de comer. */
export function encajaCon(l: Lugar): TipoViaje[] {
  const t = new Set<TipoViaje>();
  const tipo = l.tags.amenity;
  if (tipo === 'restaurant') t.add('En pareja');
  if (tipo === 'bar' || tipo === 'pub' || cocinas(l).includes('tapas') || tipo === 'food_court') t.add('Con amigos');
  if (tipo !== 'bar' && tipo !== 'pub' && (l.tags.highchair === 'yes' || l.tags.kids_area === 'yes' || l.tags.wheelchair === 'yes' || tipo === 'fast_food' || tipo === 'food_court')) t.add('En familia');
  if (tipo === 'cafe' || tipo === 'fast_food' || l.tags.counter === 'yes') t.add('Solo/a');
  if (tipo === 'cafe' && (l.tags.internet_access === 'wlan' || l.tags.internet_access === 'yes')) t.add('De trabajo');
  if (tipo === 'restaurant' && !t.has('Con amigos')) t.add('De trabajo');
  return [...t];
}

const TIPO_ES: Record<string, string> = { restaurant: 'Restaurante', cafe: 'Café', bar: 'Bar', pub: 'Pub', fast_food: 'Comida rápida', food_court: 'Zona de comidas' };

/** Una frase corta con lo que se sabe del sitio: "Restaurante de cocina portuguesa · terraza · abierto hasta tarde". */
export function resumenComer(l: Lugar): string {
  const partes: string[] = [];
  const c = cocinas(l).map((x) => COCINAS_ES[x]).filter(Boolean);
  partes.push(c.length ? `${TIPO_ES[l.tags.amenity] ?? 'Local'} de cocina ${c.slice(0, 2).join(' y ')}` : TIPO_ES[l.tags.amenity] ?? 'Local');
  if (l.tags.outdoor_seating === 'yes') partes.push('terraza');
  if (tieneVistas(l)) partes.push('con vistas');
  if (abreTarde(l)) partes.push('abierto hasta tarde');
  if (l.tags.diet_vegan === 'yes' || l.tags['diet:vegan'] === 'yes' || l.tags['diet:vegetarian'] === 'yes') partes.push('opciones vegetarianas');
  return partes.join(' · ');
}

/** Puntuación para ordenar sitios de comer según lo que se busca. */
export function puntuarComer(l: Lugar, pais: string, tipo: TipoViaje, ambiente: Ambiente | null): number {
  const amb = ambientesDe(l, pais);
  let p = 0;
  if (ambiente && amb.includes(ambiente)) p += 5;
  if (encajaCon(l).includes(tipo)) p += 3;
  if (amb.includes('Auténtico/local')) p += 1;
  if (conocido(l)) p += 2;
  if (l.tags.cuisine) p += 1;
  if (l.tags.opening_hours) p += 0.5;
  return p;
}

/** Puntuación de una visita cultural: las que tienen artículo en Wikipedia o Wikidata van primero. */
export function puntuarCultura(l: Lugar): number {
  let p = 0;
  if (l.tags.wikipedia) p += 3;
  if (l.tags.wikidata) p += 2;
  if (l.tags.tourism === 'museum' || l.tags.tourism === 'gallery') p += 2;
  if (l.tags.historic) p += 1;
  if (l.tags.tourism === 'viewpoint') p += 0.5;
  if (l.tags.website) p += 0.5;
  return p;
}

const CULTURA_ES: Record<string, string> = {
  museum: 'Museo', gallery: 'Galería de arte', attraction: 'Lugar de interés', viewpoint: 'Mirador', castle: 'Castillo', monument: 'Monumento',
  palace: 'Palacio', ruins: 'Ruinas', archaeological_site: 'Yacimiento arqueológico', church: 'Iglesia', monastery: 'Monasterio',
};

export const tipoCultura = (l: Lugar) => CULTURA_ES[l.tags.tourism ?? ''] ?? CULTURA_ES[l.tags.historic ?? ''] ?? 'Lugar de interés';

/** Días de la semana en que abre un mercadillo, si su horario lo dice. */
export const diasMercado = (l: Lugar) => diasQueAbre(l.tags.opening_hours);

/** Enlace para abrir el sitio en Google Maps buscando por nombre y ciudad. */
export const enlaceMapa = (nombre: string, ciudad: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${nombre}, ${ciudad}`)}`;
