export const TIPOS_VIAJE = ['En pareja', 'Con amigos', 'En familia', 'Solo/a', 'De trabajo'] as const;
export type TipoViaje = (typeof TIPOS_VIAJE)[number];

export const AMBIENTES = ['Romántico', 'Animado', 'Auténtico/local', 'Tranquilo', 'Con vistas', 'Económico'] as const;
export type Ambiente = (typeof AMBIENTES)[number];

export const TIPOS_TRANSPORTE = ['Vuelo', 'Tren', 'Autobús', 'Coche', 'Ferry'] as const;
export const CATEGORIAS_GASTO = ['Transporte', 'Alojamiento', 'Comida', 'Actividades', 'Compras', 'Otros'] as const;

/** Fechas en formato ISO corto: AAAA-MM-DD. Horas: HH:MM. */
export type Transporte = {
  id: string;
  tipo: (typeof TIPOS_TRANSPORTE)[number];
  codigo: string;
  desde: string;
  hasta: string;
  fecha: string;
  hora: string;
  ref: string;
};

export type Hotel = {
  id: string;
  nombre: string;
  direccion: string;
  entrada: string;
  salida: string;
  ref: string;
};

export type PlanItinerario = {
  id: string;
  fecha: string;
  hora: string;
  plan: string;
};

export type Gasto = {
  id: string;
  concepto: string;
  categoria: (typeof CATEGORIAS_GASTO)[number];
  importe: number;
};

export type Viaje = {
  id: string;
  destino: string;
  pais: string;
  iata: string;
  origen: string;
  inicio: string;
  fin: string;
  tipo: TipoViaje;
  transporte: Transporte[];
  hoteles: Hotel[];
  itinerario: PlanItinerario[];
  gastos: Gasto[];
};

export type SeccionEditable = 'transporte' | 'hoteles' | 'itinerario' | 'gastos';
export type ElementoDe<S extends SeccionEditable> = Viaje[S][number];
