export type EventoTicketmaster = {
  nombre: string;
  fecha: string;
  hora?: string;
  lugar: string;
  categoria: 'Deporte' | 'Música' | 'Espectáculos' | 'Otros';
  enlace: string;
};

type Respuesta = {
  _embedded?: {
    events?: {
      name: string;
      url: string;
      dates?: { start?: { localDate?: string; localTime?: string } };
      classifications?: { segment?: { name?: string } }[];
      _embedded?: { venues?: { name?: string }[] };
    }[];
  };
};

const CATEGORIA: Record<string, EventoTicketmaster['categoria']> = { Sports: 'Deporte', Music: 'Música', 'Arts & Theatre': 'Espectáculos' };

export const claveTicketmaster = process.env.EXPO_PUBLIC_TICKETMASTER_KEY;

/** Partidos, conciertos y espectáculos a menos de 30 km entre dos fechas (AAAA-MM-DD, ambas incluidas). */
export async function buscarEnTicketmaster(lat: number, lon: number, inicio: string, fin: string): Promise<EventoTicketmaster[]> {
  if (!claveTicketmaster) return [];
  const params = new URLSearchParams({
    apikey: claveTicketmaster,
    latlong: `${lat},${lon}`,
    radius: '30',
    unit: 'km',
    startDateTime: `${inicio}T00:00:00Z`,
    endDateTime: `${fin}T23:59:59Z`,
    size: '100',
    sort: 'date,asc',
    locale: '*',
  });
  const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
  if (!res.ok) throw new Error(`Ticketmaster respondió ${res.status}`);
  return aEventos((await res.json()) as Respuesta);
}

export function aEventos(json: Respuesta): EventoTicketmaster[] {
  const vistos = new Set<string>();
  const eventos: EventoTicketmaster[] = [];
  for (const e of json._embedded?.events ?? []) {
    const fecha = e.dates?.start?.localDate;
    if (!fecha) continue;
    // Ticketmaster repite el mismo evento por cada tipo de entrada.
    const clave = `${e.name}|${fecha}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    eventos.push({
      nombre: e.name,
      fecha,
      hora: e.dates?.start?.localTime?.slice(0, 5),
      lugar: e._embedded?.venues?.[0]?.name ?? '',
      categoria: CATEGORIA[e.classifications?.[0]?.segment?.name ?? ''] ?? 'Otros',
      enlace: e.url,
    });
  }
  return eventos;
}
