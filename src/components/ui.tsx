import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts, MaxContentWidth, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Pantalla con scroll y ancho máximo, para que en web se vea como una columna de móvil. */
export function Pantalla({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.columna}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Variante = 'titulo' | 'subtitulo' | 'cuerpo' | 'secundario' | 'etiqueta' | 'codigo';

export function Texto({ variante = 'cuerpo', color, style, ...props }: TextProps & { variante?: Variante; color?: ThemeColor }) {
  const c = useTheme();
  const porDefecto: ThemeColor = variante === 'secundario' || variante === 'etiqueta' ? 'textSecondary' : variante === 'codigo' ? 'accent' : 'text';
  return <Text {...props} style={[styles[variante], { color: c[color ?? porDefecto] }, style]} />;
}

export function Boton({ titulo, onPress, tipo = 'principal', deshabilitado }: { titulo: string; onPress: () => void; tipo?: 'principal' | 'borde' | 'enlace' | 'peligro'; deshabilitado?: boolean }) {
  const c = useTheme();
  const fondo = tipo === 'principal' ? c.accent : 'transparent';
  const texto = tipo === 'principal' ? c.onAccent : tipo === 'peligro' ? c.danger : c.accent;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        tipo === 'enlace' || tipo === 'peligro' ? styles.enlace : styles.boton,
        { backgroundColor: fondo, borderColor: tipo === 'borde' ? c.accent : 'transparent', opacity: pressed || deshabilitado ? 0.6 : 1 },
      ]}>
      <Text style={[styles.botonTexto, { color: texto }]}>{titulo}</Text>
    </Pressable>
  );
}

export function Chip({ texto, activo, onPress }: { texto: string; activo?: boolean; onPress?: () => void }) {
  const c = useTheme();
  const contenido = (
    <View style={[styles.chip, { backgroundColor: activo ? c.accent : c.accentSoft }]}>
      <Text style={[styles.chipTexto, { color: activo ? c.onAccent : c.accent }]}>{texto}</Text>
    </View>
  );
  if (!onPress) return contenido;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: activo }} onPress={onPress}>
      {contenido}
    </Pressable>
  );
}

export function Tarjeta({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const c = useTheme();
  return <View style={[styles.tarjeta, { backgroundColor: c.surface, borderColor: c.line }, style]}>{children}</View>;
}

export function Fila({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.fila, style]}>{children}</View>;
}

export function Campo({ etiqueta, error, ...props }: TextInputProps & { etiqueta: string; error?: string }) {
  const c = useTheme();
  return (
    <View style={styles.campo}>
      <Texto variante="etiqueta">{etiqueta}</Texto>
      <TextInput
        placeholderTextColor={c.textSecondary}
        {...props}
        style={[styles.input, { color: c.text, backgroundColor: c.background, borderColor: error ? c.danger : c.line }]}
      />
      {error ? <Texto color="danger" style={{ fontSize: 12 }}>{error}</Texto> : null}
    </View>
  );
}

export function Selector<T extends string>({ etiqueta, opciones, valor, onChange }: { etiqueta: string; opciones: readonly T[]; valor: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.campo}>
      <Texto variante="etiqueta">{etiqueta}</Texto>
      <Fila>
        {opciones.map((o) => (
          <Chip key={o} texto={o} activo={o === valor} onPress={() => onChange(o)} />
        ))}
      </Fila>
    </View>
  );
}

export function Nota({ children }: { children: ReactNode }) {
  const c = useTheme();
  return (
    <View style={[styles.nota, { backgroundColor: c.accentSoft }]}>
      <Texto variante="secundario" style={{ fontSize: 12.5 }}>{children}</Texto>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  columna: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.three },
  titulo: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  subtitulo: { fontSize: 18, fontWeight: '700' },
  cuerpo: { fontSize: 15, lineHeight: 21 },
  secundario: { fontSize: 13.5, lineHeight: 19 },
  etiqueta: { fontSize: 11.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  codigo: { fontFamily: Fonts?.mono, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
  boton: { borderRadius: 999, paddingVertical: 9, paddingHorizontal: 16, borderWidth: 1.5, alignSelf: 'flex-start' },
  enlace: { paddingVertical: 4 },
  botonTexto: { fontWeight: '600', fontSize: 14 },
  chip: { borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11 },
  chipTexto: { fontSize: 12.5, fontWeight: '600' },
  tarjeta: { borderRadius: 14, borderWidth: 1, padding: Spacing.three, gap: Spacing.two },
  fila: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.two },
  campo: { gap: Spacing.one, flexGrow: 1, minWidth: 140 },
  input: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  nota: { borderRadius: 10, padding: 12 },
});
