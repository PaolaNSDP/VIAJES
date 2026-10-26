/** Descripción corta en español de cada elemento de Wikidata (p. ej. "monasterio en Lisboa, Portugal"). */
export async function descripcionesWikidata(ids: string[]): Promise<Record<string, string>> {
  const validos = [...new Set(ids.filter((id) => /^Q\d+$/.test(id)))].slice(0, 50);
  if (!validos.length) return {};
  const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${validos.join('|')}&props=descriptions&languages=es|en&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return {};
  const json = (await res.json()) as { entities?: Record<string, { descriptions?: Record<string, { value: string }> }> };
  const salida: Record<string, string> = {};
  for (const [id, e] of Object.entries(json.entities ?? {})) {
    const d = e.descriptions?.es?.value ?? e.descriptions?.en?.value;
    if (d) salida[id] = d.charAt(0).toUpperCase() + d.slice(1);
  }
  return salida;
}
