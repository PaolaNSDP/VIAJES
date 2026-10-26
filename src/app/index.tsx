import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Boton, Chip, Fila, Nota, Pantalla, Texto } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useViajes } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { diasHasta, fechaLarga } from '@/lib/fechas';

export default function MisViajes() {
  const { viajes, cargado, email, errorNube, salir } = useViajes();
  const c = useTheme();
  const ordenados = [...viajes].sort((a, b) => a.inicio.localeCompare(b.inicio));

  return (
    <Pantalla>
      <Fila style={{ justifyContent: 'space-between' }}>
        <Texto variante="titulo">Próximos viajes</Texto>
        <Boton titulo="+ Viaje" onPress={() => router.push('/nuevo')} />
      </Fila>

      {errorNube ? <Nota>{errorNube}</Nota> : null}
      {!cargado ? <ActivityIndicator color={c.accent} /> : null}
      {cargado && !ordenados.length ? <Nota>Todavía no tienes viajes. Crea el primero con «+ Viaje».</Nota> : null}

      {ordenados.map((v) => {
        const dias = diasHasta(v.inicio);
        return (
          <Link key={v.id} href={{ pathname: '/viaje/[id]', params: { id: v.id } }} asChild>
            <Pressable style={({ pressed }) => [styles.tarjeta, { backgroundColor: c.surface, borderColor: c.line, opacity: pressed ? 0.8 : 1 }]}>
              <View style={styles.principal}>
                <Fila>
                  <Texto variante="codigo">{v.origen} → {v.iata || '—'}</Texto>
                  <Chip texto={v.tipo} />
                </Fila>
                <Texto variante="subtitulo">{v.destino}</Texto>
                <Texto variante="secundario">
                  {fechaLarga(v.inicio)} – {fechaLarga(v.fin)}{v.pais ? ` · ${v.pais}` : ''}
                </Texto>
              </View>
              <View style={[styles.talon, { backgroundColor: c.stub, borderLeftColor: c.background }]}>
                {dias > 0 ? (
                  <>
                    <Texto color="onStub" style={styles.dias}>{dias}</Texto>
                    <Texto color="onStub" variante="etiqueta" style={{ color: c.onStub }}>{dias === 1 ? 'día' : 'días'}</Texto>
                  </>
                ) : (
                  <Texto color="onStub" style={{ fontWeight: '800' }}>{diasHasta(v.fin) >= 0 ? '¡Ya!' : 'Hecho'}</Texto>
                )}
              </View>
            </Pressable>
          </Link>
        );
      })}

      {email ? (
        <Fila style={{ justifyContent: 'space-between', marginTop: Spacing.four }}>
          <Texto variante="secundario">Has entrado como {email}</Texto>
          <Boton tipo="enlace" titulo="Salir" onPress={salir} />
        </Fila>
      ) : null}
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  tarjeta: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  principal: { flex: 1, padding: Spacing.three, gap: Spacing.one, minWidth: 0 },
  talon: { width: 84, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 2, borderStyle: 'dashed', padding: Spacing.two },
  dias: { fontSize: 28, fontWeight: '800', lineHeight: 30 },
});
