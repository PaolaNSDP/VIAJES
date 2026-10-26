import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { nuevoId, useViajes } from '@/data/store';
import type { ElementoDe, SeccionEditable, Viaje } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { esFechaValida, esHoraValida, fechaLarga } from '@/lib/fechas';

import { SECCIONES, type DefCampo } from './secciones';
import { Boton, Campo, Fila, Selector, Tarjeta, Texto } from './ui';

type Valores = Record<string, string>;

/** Lista de una sección del viaje (transporte, hoteles...) con alta, edición y borrado. */
export function SeccionEditableVista<S extends SeccionEditable>({ viaje, seccion }: { viaje: Viaje; seccion: S }) {
  const def = SECCIONES[seccion];
  const [editando, setEditando] = useState<string | 'nuevo' | null>(null);
  const elementos = [...(viaje[seccion] as ElementoDe<S>[])];
  if (def.orden) elementos.sort((a, b) => def.orden!(a).localeCompare(def.orden!(b)));

  const lista =
    seccion === 'itinerario' && elementos.length ? (
      [...new Set(elementos.map((e) => (e as ElementoDe<'itinerario'>).fecha))].map((dia) => (
        <View key={dia} style={{ gap: Spacing.one }}>
          <Texto variante="subtitulo" color="accent" style={{ fontSize: 14 }}>
            {fechaLarga(dia)}
          </Texto>
          <ListaElementos viaje={viaje} seccion={seccion} elementos={elementos.filter((e) => (e as ElementoDe<'itinerario'>).fecha === dia)} onEditar={setEditando} />
        </View>
      ))
    ) : (
      <ListaElementos viaje={viaje} seccion={seccion} elementos={elementos} onEditar={setEditando} />
    );

  return (
    <View style={{ gap: Spacing.three }}>
      <Fila style={{ justifyContent: 'space-between' }}>
        <Texto variante="subtitulo">{def.titulo}</Texto>
        {editando ? null : <Boton tipo="borde" titulo="+ Añadir" onPress={() => setEditando('nuevo')} />}
      </Fila>
      {editando ? (
        <Formulario
          key={editando}
          viaje={viaje}
          seccion={seccion}
          elemento={editando === 'nuevo' ? undefined : elementos.find((e) => e.id === editando)}
          onCerrar={() => setEditando(null)}
        />
      ) : null}
      {lista}
    </View>
  );
}

function ListaElementos<S extends SeccionEditable>({ viaje, seccion, elementos, onEditar }: { viaje: Viaje; seccion: S; elementos: ElementoDe<S>[]; onEditar: (id: string) => void }) {
  const def = SECCIONES[seccion];
  const c = useTheme();
  const { borrarElemento } = useViajes();
  const [confirmar, setConfirmar] = useState<string | null>(null);

  if (!elementos.length)
    return (
      <Tarjeta>
        <Texto variante="secundario" style={{ textAlign: 'center' }}>
          Aún no hay nada en {def.titulo.toLowerCase()}. Añade el primero.
        </Texto>
      </Tarjeta>
    );

  return (
    <Tarjeta style={{ padding: 0, gap: 0 }}>
      {elementos.map((e, i) => (
        <View key={e.id} style={[styles.item, i > 0 && { borderTopWidth: 1, borderTopColor: c.line }]}>
          <View style={[styles.icono, { backgroundColor: c.accentSoft }]}>
            <Texto variante="codigo" style={{ fontSize: 11 }}>{def.icono(e)}</Texto>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Texto style={{ fontWeight: '600' }}>{def.linea1(e)}</Texto>
            {def.linea2(e) ? <Texto variante="secundario">{def.linea2(e)}</Texto> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Boton tipo="enlace" titulo="Editar" onPress={() => onEditar(e.id)} />
            <Boton
              tipo="peligro"
              titulo={confirmar === e.id ? '¿Seguro?' : 'Borrar'}
              onPress={() => (confirmar === e.id ? borrarElemento(viaje.id, seccion, e.id) : setConfirmar(e.id))}
            />
          </View>
        </View>
      ))}
    </Tarjeta>
  );
}

function valoresIniciales(campos: DefCampo[], viaje: Viaje, elemento?: object): Valores {
  const v: Valores = {};
  for (const campo of campos) {
    const actual = elemento ? (elemento as Record<string, unknown>)[campo.clave] : undefined;
    v[campo.clave] =
      actual != null ? String(actual) : campo.tipo === 'fecha' ? viaje.inicio : campo.tipo === 'opcion' ? campo.opciones![0] : '';
  }
  return v;
}

function validar(campos: DefCampo[], v: Valores): Record<string, string> {
  const errores: Record<string, string> = {};
  for (const c of campos) {
    const valor = v[c.clave].trim();
    if (c.obligatorio && !valor) errores[c.clave] = 'Obligatorio';
    else if (valor && c.tipo === 'fecha' && !esFechaValida(valor)) errores[c.clave] = 'Usa el formato AAAA-MM-DD';
    else if (valor && c.tipo === 'hora' && !esHoraValida(valor)) errores[c.clave] = 'Usa el formato HH:MM';
    else if (valor && c.tipo === 'importe' && isNaN(Number(valor.replace(',', '.')))) errores[c.clave] = 'Escribe un número';
  }
  return errores;
}

function Formulario<S extends SeccionEditable>({ viaje, seccion, elemento, onCerrar }: { viaje: Viaje; seccion: S; elemento?: ElementoDe<S>; onCerrar: () => void }) {
  const def = SECCIONES[seccion];
  const c = useTheme();
  const { guardarElemento } = useViajes();
  const [valores, setValores] = useState(() => valoresIniciales(def.campos, viaje, elemento));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const cambiar = (clave: string, valor: string) => setValores((v) => ({ ...v, [clave]: valor }));

  const guardar = () => {
    const e = validar(def.campos, valores);
    setErrores(e);
    if (Object.keys(e).length) return;
    const datos: Record<string, string | number> = { id: elemento?.id ?? nuevoId() };
    for (const campo of def.campos) {
      const valor = valores[campo.clave].trim();
      datos[campo.clave] = campo.tipo === 'importe' ? Number(valor.replace(',', '.')) : valor;
    }
    guardarElemento(viaje.id, seccion, datos as unknown as ElementoDe<S>);
    onCerrar();
  };

  return (
    <Tarjeta style={{ borderColor: c.accent, borderWidth: 1.5, gap: Spacing.three }}>
      <Fila style={{ alignItems: 'flex-start', gap: Spacing.three }}>
        {def.campos.map((campo) =>
          campo.tipo === 'opcion' ? (
            <Selector key={campo.clave} etiqueta={campo.etiqueta} opciones={campo.opciones!} valor={valores[campo.clave]} onChange={(v) => cambiar(campo.clave, v)} />
          ) : (
            <Campo
              key={campo.clave}
              etiqueta={campo.etiqueta}
              value={valores[campo.clave]}
              onChangeText={(t) => cambiar(campo.clave, t)}
              error={errores[campo.clave]}
              placeholder={campo.tipo === 'fecha' ? 'AAAA-MM-DD' : campo.tipo === 'hora' ? 'HH:MM' : undefined}
              keyboardType={campo.tipo === 'importe' ? 'decimal-pad' : campo.tipo === 'texto' ? 'default' : 'numbers-and-punctuation'}
            />
          ),
        )}
      </Fila>
      <Fila>
        <Boton titulo="Guardar" onPress={guardar} />
        <Boton tipo="enlace" titulo="Cancelar" onPress={onCerrar} />
      </Fila>
    </Tarjeta>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  icono: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
