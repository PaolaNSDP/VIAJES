import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Cultura, DondeComer, Eventos } from '@/components/recomendaciones';
import { ResumenGastos } from '@/components/resumen-gastos';
import { SeccionEditableVista } from '@/components/seccion-editable';
import { Boton, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { Fonts, Spacing } from '@/constants/theme';
import { useViaje, useViajes } from '@/data/store';
import { useTheme } from '@/hooks/use-theme';
import { diasEntre, fechaCorta } from '@/lib/fechas';

const PESTANAS = [
  ['transporte', 'Transporte'],
  ['hoteles', 'Alojamiento'],
  ['itinerario', 'Itinerario'],
  ['gastos', 'Gastos'],
  ['comer', 'Dónde comer'],
  ['cultura', 'Cultura'],
  ['eventos', 'Eventos'],
] as const;
type Pestana = (typeof PESTANAS)[number][0];

export default function DetalleViaje() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const viaje = useViaje(id);
  const { cargado, borrarViaje } = useViajes();
  const c = useTheme();
  const [pestana, setPestana] = useState<Pestana>('transporte');
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);

  if (!viaje)
    return (
      <Pantalla>
        <Texto variante="secundario">{cargado ? 'Este viaje ya no existe.' : 'Cargando…'}</Texto>
      </Pantalla>
    );

  return (
    <Pantalla>
      <Stack.Screen options={{ title: viaje.destino }} />

      <Tarjeta style={{ padding: 0, gap: 0 }}>
        <View style={styles.billeteArriba}>
          <View>
            <Text style={[styles.iata, { color: c.text }]}>{viaje.origen}</Text>
            <Texto variante="secundario">Origen</Texto>
          </View>
          <Texto variante="secundario" style={{ fontSize: 20 }}>✈</Texto>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.iata, { color: c.text }]}>{viaje.iata || '—'}</Text>
            <Texto variante="secundario">{[viaje.destino, viaje.pais].filter(Boolean).join(', ')}</Texto>
          </View>
        </View>
        <View style={[styles.billeteAbajo, { borderTopColor: c.line }]}>
          {[
            ['Ida', fechaCorta(viaje.inicio)],
            ['Vuelta', fechaCorta(viaje.fin)],
            ['Noches', String(diasEntre(viaje.inicio, viaje.fin))],
          ].map(([etiqueta, valor]) => (
            <View key={etiqueta} style={{ flex: 1 }}>
              <Texto variante="etiqueta">{etiqueta}</Texto>
              <Texto variante="codigo" color="text">{valor}</Texto>
            </View>
          ))}
        </View>
      </Tarjeta>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {PESTANAS.map(([clave, titulo]) => {
          const activa = clave === pestana;
          return (
            <Pressable
              key={clave}
              accessibilityRole="tab"
              accessibilityState={{ selected: activa }}
              onPress={() => setPestana(clave)}
              style={[styles.pestana, { backgroundColor: activa ? c.text : c.surface, borderColor: activa ? c.text : c.line }]}>
              <Text style={{ fontWeight: '600', fontSize: 13.5, color: activa ? c.background : c.textSecondary }}>{titulo}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {pestana === 'gastos' ? <ResumenGastos viaje={viaje} /> : null}
      {pestana === 'transporte' || pestana === 'hoteles' || pestana === 'itinerario' || pestana === 'gastos' ? (
        <SeccionEditableVista key={pestana} viaje={viaje} seccion={pestana} />
      ) : null}
      {pestana === 'comer' ? <DondeComer viaje={viaje} /> : null}
      {pestana === 'cultura' ? <Cultura viaje={viaje} /> : null}
      {pestana === 'eventos' ? <Eventos viaje={viaje} /> : null}

      <View style={{ marginTop: Spacing.four }}>
        <Boton
          tipo="peligro"
          titulo={confirmarBorrado ? 'Pulsa otra vez para eliminar el viaje' : 'Eliminar viaje'}
          onPress={() => {
            if (!confirmarBorrado) return setConfirmarBorrado(true);
            borrarViaje(viaje.id);
            router.back();
          }}
        />
      </View>
    </Pantalla>
  );
}

const styles = StyleSheet.create({
  billeteArriba: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', padding: 18, paddingBottom: 14, gap: 8 },
  iata: { fontFamily: Fonts?.mono, fontSize: 32, fontWeight: '700', lineHeight: 36 },
  billeteAbajo: { flexDirection: 'row', borderTopWidth: 2, borderStyle: 'dashed', paddingHorizontal: 18, paddingVertical: 12, gap: 8 },
  pestana: { borderRadius: 999, borderWidth: 1, paddingVertical: 7, paddingHorizontal: 13 },
});
