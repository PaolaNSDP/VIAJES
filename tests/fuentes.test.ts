/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { diasQueAbre } from '../src/services/fuentes/horarios';
import { aLugares, ambientesDe, encajaCon, puntuarComer, resumenComer, type ElementoOsm } from '../src/services/fuentes/osm';
import { aEventos } from '../src/services/fuentes/ticketmaster';

test('horarios de OpenStreetMap', () => {
  assert.deepEqual(diasQueAbre('Tu,Sa 09:00-18:00'), [2, 6]);
  assert.deepEqual(diasQueAbre('Su 10:00-14:00'), [0]);
  assert.deepEqual(diasQueAbre('Mo-Fr 08:00-14:00; Sa 09:00-13:00'), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(diasQueAbre('Fr-Mo 10:00-20:00'), [0, 1, 5, 6]);
  assert.deepEqual(diasQueAbre('Mo-Su 09:00-20:00; Tu off'), [0, 1, 3, 4, 5, 6]);
  assert.deepEqual(diasQueAbre('24/7'), [0, 1, 2, 3, 4, 5, 6]);
  assert.equal(diasQueAbre(undefined), null);
  assert.equal(diasQueAbre('sunrise-sunset'), null);
});

const elementos: ElementoOsm[] = [
  { type: 'node', id: 1, lat: 38.7, lon: -9.1, tags: { amenity: 'restaurant', name: 'Tasca do Zé', cuisine: 'portuguese', outdoor_seating: 'yes', opening_hours: 'Mo-Sa 12:00-02:00' } },
  { type: 'way', id: 2, center: { lat: 38.71, lon: -9.13 }, tags: { amenity: 'cafe', name: 'Café Tranquilo', internet_access: 'wlan' } },
  { type: 'node', id: 3, lat: 38.7, lon: -9.1, tags: { amenity: 'bar', name: 'Rooftop Bar' } },
  { type: 'node', id: 4, lat: 38.7, lon: -9.1, tags: { amenity: 'restaurant' } }, // sin nombre: se descarta
  { type: 'node', id: 1, lat: 38.7, lon: -9.1, tags: { amenity: 'restaurant', name: 'Tasca do Zé' } }, // repetido
];

test('convierte elementos de Overpass en lugares', () => {
  const l = aLugares(elementos);
  assert.deepEqual(l.map((x) => x.nombre), ['Tasca do Zé', 'Café Tranquilo', 'Rooftop Bar']);
  assert.equal(l[1].lat, 38.71);
});

test('deduce ambiente, tipo de viaje y resumen', () => {
  const [tasca, cafe, bar] = aLugares(elementos);
  assert.deepEqual(new Set(ambientesDe(tasca, 'Portugal')), new Set(['Auténtico/local', 'Animado', 'Romántico']));
  assert.deepEqual(ambientesDe(cafe, 'Portugal'), ['Tranquilo']);
  assert.ok(ambientesDe(bar, 'Portugal').includes('Con vistas'));
  assert.ok(encajaCon(cafe).includes('De trabajo'));
  assert.ok(encajaCon(bar).includes('Con amigos'));
  assert.ok(!encajaCon(bar).includes('En familia'));
  assert.equal(resumenComer(tasca), 'Restaurante de cocina portuguesa · terraza · abierto hasta tarde');
  assert.ok(puntuarComer(tasca, 'Portugal', 'En pareja', 'Auténtico/local') > puntuarComer(cafe, 'Portugal', 'En pareja', 'Auténtico/local'));
});

test('convierte eventos de Ticketmaster y quita repetidos', () => {
  const ev = aEventos({
    _embedded: {
      events: [
        { name: 'Benfica vs Porto', url: 'https://tm/1', dates: { start: { localDate: '2026-11-15', localTime: '20:30:00' } }, classifications: [{ segment: { name: 'Sports' } }], _embedded: { venues: [{ name: 'Estádio da Luz' }] } },
        { name: 'Benfica vs Porto', url: 'https://tm/2', dates: { start: { localDate: '2026-11-15' } } },
        { name: 'Sin fecha', url: 'https://tm/3' },
        { name: 'Concierto', url: 'https://tm/4', dates: { start: { localDate: '2026-11-14' } }, classifications: [{ segment: { name: 'Music' } }] },
      ],
    },
  });
  assert.deepEqual(ev.map((e) => [e.nombre, e.categoria, e.hora]), [['Benfica vs Porto', 'Deporte', '20:30'], ['Concierto', 'Música', undefined]]);
});
