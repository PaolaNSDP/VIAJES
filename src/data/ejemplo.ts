import type { Viaje } from './types';

/** Viajes de ejemplo que se cargan la primera vez que se abre la app. */
export const VIAJES_EJEMPLO: Viaje[] = [
  {
    id: 'ejemplo-lisboa',
    destino: 'Lisboa',
    pais: 'Portugal',
    iata: 'LIS',
    origen: 'MAD',
    inicio: '2026-11-13',
    fin: '2026-11-17',
    tipo: 'Con amigos',
    transporte: [
      { id: 't1', tipo: 'Vuelo', codigo: 'TP1027', desde: 'MAD', hasta: 'LIS', fecha: '2026-11-13', hora: '09:40', ref: 'Q7HX2L' },
      { id: 't2', tipo: 'Vuelo', codigo: 'TP1018', desde: 'LIS', hasta: 'MAD', fecha: '2026-11-17', hora: '19:55', ref: 'Q7HX2L' },
    ],
    hoteles: [
      { id: 'h1', nombre: 'Casa do Alfama', direccion: 'Rua de São Miguel 12', entrada: '2026-11-13', salida: '2026-11-17', ref: 'BK-88231' },
    ],
    itinerario: [
      { id: 'i1', fecha: '2026-11-13', hora: '13:00', plan: 'Comida en Time Out Market' },
      { id: 'i2', fecha: '2026-11-14', hora: '10:00', plan: 'Belém: monasterio y torre' },
      { id: 'i3', fecha: '2026-11-14', hora: '21:00', plan: 'Cena y fado en Alfama' },
      { id: 'i4', fecha: '2026-11-15', hora: '11:00', plan: 'Paseo por LX Factory' },
    ],
    gastos: [
      { id: 'g1', concepto: 'Vuelos ida y vuelta', categoria: 'Transporte', importe: 148 },
      { id: 'g2', concepto: 'Casa do Alfama, 4 noches', categoria: 'Alojamiento', importe: 392 },
      { id: 'g3', concepto: 'Lisboa Card 72 h', categoria: 'Actividades', importe: 54 },
    ],
  },
  {
    id: 'ejemplo-roma',
    destino: 'Roma',
    pais: 'Italia',
    iata: 'FCO',
    origen: 'MAD',
    inicio: '2026-12-04',
    fin: '2026-12-08',
    tipo: 'En pareja',
    transporte: [
      { id: 't1', tipo: 'Vuelo', codigo: 'IB3234', desde: 'MAD', hasta: 'FCO', fecha: '2026-12-04', hora: '07:15', ref: 'ZP4MN9' },
    ],
    hoteles: [],
    itinerario: [],
    gastos: [{ id: 'g1', concepto: 'Vuelo de ida', categoria: 'Transporte', importe: 96 }],
  },
];
