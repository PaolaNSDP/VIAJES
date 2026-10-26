const DIAS_OSM = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * Días de la semana (0 = domingo) en que abre un sitio, a partir de su `opening_hours` de OpenStreetMap.
 * Entiende lo habitual ("Mo-Fr 08:00-14:00; Sa 09:00-13:00", "Sa,Su 10:00-18:00", "24/7").
 * Devuelve null si el horario no se puede interpretar.
 */
export function diasQueAbre(horario: string | undefined): number[] | null {
  if (!horario) return null;
  const texto = horario.trim();
  if (texto === '24/7') return [0, 1, 2, 3, 4, 5, 6];
  const dias = new Set<number>();
  for (const regla of texto.split(';')) {
    const r = regla.trim();
    if (!r) continue;
    const cerrado = /\b(off|closed)\b/i.test(r);
    // Solo la parte de días al principio de la regla: "Mo-Fr,Su 09:00-14:00" → "Mo-Fr,Su"
    const m = r.match(/^((?:[A-Z][a-z](?:-[A-Z][a-z])?)(?:,(?:[A-Z][a-z](?:-[A-Z][a-z])?))*)\b/);
    if (!m) {
      // Una regla que empieza por hora ("09:00-14:00") vale para todos los días.
      if (/^\d{1,2}:\d{2}/.test(r)) [0, 1, 2, 3, 4, 5, 6].forEach((d) => dias.add(d));
      continue;
    }
    for (const parte of m[1].split(',')) {
      const [desde, hasta] = parte.split('-').map((d) => DIAS_OSM.indexOf(d));
      if (desde < 0 || (hasta !== undefined && hasta < 0)) return null;
      const lista: number[] = [];
      if (hasta === undefined) lista.push(desde);
      else for (let d = desde; ; d = (d + 1) % 7) {
        lista.push(d);
        if (d === hasta) break;
      }
      lista.forEach((d) => (cerrado ? dias.delete(d) : dias.add(d)));
    }
  }
  return dias.size ? [...dias].sort() : null;
}
