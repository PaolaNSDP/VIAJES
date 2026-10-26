import { StyleSheet, View } from 'react-native';

import type { Viaje } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { diasEntre } from '@/lib/fechas';

import { euros } from './secciones';
import { Tarjeta, Texto } from './ui';

export function ResumenGastos({ viaje }: { viaje: Viaje }) {
  const c = useTheme();
  const total = viaje.gastos.reduce((s, g) => s + g.importe, 0);
  const porCategoria = new Map<string, number>();
  for (const g of viaje.gastos) porCategoria.set(g.categoria, (porCategoria.get(g.categoria) ?? 0) + g.importe);
  const filas = [...porCategoria].sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...porCategoria.values());
  const noches = Math.max(1, diasEntre(viaje.inicio, viaje.fin));

  return (
    <Tarjeta>
      <Texto variante="etiqueta">Gasto total</Texto>
      <View style={styles.total}>
        <Texto style={styles.cifra}>{euros(total)}</Texto>
        <Texto variante="secundario">{euros(total / noches)} por noche</Texto>
      </View>
      {filas.map(([categoria, importe]) => (
        <View key={categoria} style={styles.barra}>
          <Texto variante="secundario" style={{ width: 96 }}>{categoria}</Texto>
          <View style={[styles.pista, { backgroundColor: c.accentSoft }]}>
            <View style={[styles.relleno, { backgroundColor: c.accent, width: `${(importe / max) * 100}%` }]} />
          </View>
          <Texto variante="secundario" style={{ width: 80, textAlign: 'right', fontVariant: ['tabular-nums'] }}>
            {euros(importe)}
          </Texto>
        </View>
      ))}
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  total: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' },
  cifra: { fontSize: 32, fontWeight: '800', fontVariant: ['tabular-nums'] },
  barra: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pista: { flex: 1, height: 10, borderRadius: 6, overflow: 'hidden' },
  relleno: { height: '100%', borderRadius: 6 },
});
