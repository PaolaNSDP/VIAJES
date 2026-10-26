export type Coordenadas = { lat: number; lon: number; nombre: string; pais: string };

/** Busca las coordenadas de una ciudad con el geocodificador gratuito de Open-Meteo. */
export async function geocodificar(destino: string, pais: string): Promise<Coordenadas | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destino.trim())}&count=10&language=es&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`El buscador de ciudades respondió ${res.status}`);
  const json = (await res.json()) as { results?: { latitude: number; longitude: number; name: string; country?: string; population?: number }[] };
  const resultados = json.results ?? [];
  const norm = (s = '') => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  // Si se indicó país, se prefiere esa coincidencia; si no, la más poblada.
  const delPais = pais ? resultados.filter((r) => norm(r.country) === norm(pais)) : [];
  const candidatos = delPais.length ? delPais : resultados;
  const mejor = [...candidatos].sort((a, b) => (b.population ?? 0) - (a.population ?? 0))[0];
  return mejor ? { lat: mejor.latitude, lon: mejor.longitude, nombre: mejor.name, pais: mejor.country ?? pais } : null;
}
