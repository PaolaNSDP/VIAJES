import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { nuevoId, useViajes } from '@/data/store';
import { AMBIENTES, TIPOS_VIAJE, type Ambiente, type TipoViaje, type Viaje } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { diasDelViaje, fechaCorta } from '@/lib/fechas';
import { buscarCultura, buscarEventos, buscarRestaurantes, type Evento, type Restaurante, type VisitaCultural } from '@/services/recomendaciones';

import { Boton, Chip, Fila, Nota, Tarjeta, Texto } from './ui';

/** Carga un resultado asíncrono y lo vuelve a pedir cuando cambian las dependencias. */
function useCarga<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | undefined>(undefined);
  useEffect(() => {
    let vigente = true;
    cargar().then((d) => vigente && setDatos(d));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return datos;
}

/** Botón que añade una sugerencia al itinerario, en su fecha o en el primer día libre del viaje. */
function AnadirAlItinerario({ viaje, plan, fecha }: { viaje: Viaje; plan: string; fecha?: string | null }) {
  const { guardarElemento } = useViajes();
  const ya = viaje.itinerario.find((i) => i.plan === plan);
  if (ya) return <Texto variante="secundario" color="accent">✓ En tu itinerario el {fechaCorta(ya.fecha)}</Texto>;
  const anadir = () => {
    const ocupados = new Set(viaje.itinerario.map((i) => i.fecha));
    const dia = fecha ?? diasDelViaje(viaje.inicio, viaje.fin).find((d) => !ocupados.has(d)) ?? viaje.inicio;
    guardarElemento(viaje.id, 'itinerario', { id: nuevoId(), fecha: dia, hora: '10:00', plan });
  };
  return <Boton tipo="enlace" titulo="+ Añadir al itinerario" onPress={anadir} />;
}

function SinDatos({ viaje }: { viaje: Viaje }) {
  return (
    <Tarjeta>
      <Texto variante="subtitulo">Aún no hay sugerencias para {viaje.destino}</Texto>
      <Texto variante="secundario">De momento solo hay datos de ejemplo para Lisboa y Roma. Cuando conectemos las fuentes reales, saldrán para cualquier destino.</Texto>
    </Tarjeta>
  );
}

function Sugerencia({ viaje, nombre, meta, motivo, fecha, cabecera }: { viaje: Viaje; nombre: string; meta: string; motivo: string; fecha?: string | null; cabecera?: ReactNode }) {
  return (
    <Tarjeta>
      {cabecera}
      <Texto variante="subtitulo" style={{ fontSize: 16 }}>{nombre}</Texto>
      <Texto variante="secundario">{meta}</Texto>
      <Texto variante="secundario">
        <Texto variante="secundario" color="text" style={{ fontWeight: '600' }}>Por qué te encaja: </Texto>
        {motivo}
      </Texto>
      <AnadirAlItinerario viaje={viaje} plan={nombre} fecha={fecha} />
    </Tarjeta>
  );
}

export function DondeComer({ viaje }: { viaje: Viaje }) {
  const [tipo, setTipo] = useState<TipoViaje>(viaje.tipo);
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const lista = useCarga<Restaurante[] | null>(() => buscarRestaurantes(viaje, tipo, ambiente), [viaje.destino, tipo, ambiente]);

  if (lista === null) return <SinDatos viaje={viaje} />;
  return (
    <View style={{ gap: Spacing.three }}>
      <View style={{ gap: Spacing.two }}>
        <Texto variante="etiqueta">Tipo de viaje</Texto>
        <Fila>{TIPOS_VIAJE.map((t) => <Chip key={t} texto={t} activo={t === tipo} onPress={() => setTipo(t)} />)}</Fila>
      </View>
      <View style={{ gap: Spacing.two }}>
        <Texto variante="etiqueta">Ambiente</Texto>
        <Fila>{AMBIENTES.map((a) => <Chip key={a} texto={a} activo={a === ambiente} onPress={() => setAmbiente(a === ambiente ? null : a)} />)}</Fila>
      </View>
      {lista?.length === 0 ? <Texto variante="secundario">No hay sugerencias con ese ambiente. Prueba otro.</Texto> : null}
      {lista?.map((r) => (
        <Sugerencia key={r.nombre} viaje={viaje} nombre={r.nombre} meta={`${r.zona} · ${r.precio} · ${r.ambientes.join(', ')}`} motivo={r.motivo} />
      ))}
      <Nota>Sugerencias de ejemplo. Más adelante vendrán de Google Places y las ordenará Claude según el ambiente y el tipo de viaje.</Nota>
    </View>
  );
}

export function Cultura({ viaje }: { viaje: Viaje }) {
  const lista = useCarga<VisitaCultural[] | null>(() => buscarCultura(viaje), [viaje.destino]);
  if (lista === null) return <SinDatos viaje={viaje} />;
  return (
    <View style={{ gap: Spacing.three }}>
      <Texto variante="subtitulo">Visitas culturales</Texto>
      {lista?.map((v) => <Sugerencia key={v.nombre} viaje={viaje} nombre={v.nombre} meta={`${v.zona} · ${v.duracion}`} motivo={v.motivo} />)}
      <Nota>Al añadir una visita al itinerario se coloca en el primer día libre de tu viaje.</Nota>
    </View>
  );
}

export function Eventos({ viaje }: { viaje: Viaje }) {
  const c = useTheme();
  const [categoria, setCategoria] = useState<string>('Todos');
  const lista = useCarga<Evento[] | null>(() => buscarEventos(viaje), [viaje.destino, viaje.inicio, viaje.fin]);
  if (lista === null) return <SinDatos viaje={viaje} />;
  const categorias = ['Todos', ...new Set(lista?.map((e) => e.categoria))];
  const visibles = lista?.filter((e) => categoria === 'Todos' || e.categoria === categoria) ?? [];

  return (
    <View style={{ gap: Spacing.three }}>
      <Texto variante="subtitulo">Qué pasa en {viaje.destino} durante tu viaje</Texto>
      <Fila>{categorias.map((cat) => <Chip key={cat} texto={cat} activo={cat === categoria} onPress={() => setCategoria(cat)} />)}</Fila>
      {lista && !visibles.length ? <Texto variante="secundario">No hay eventos de esta categoría en tus fechas.</Texto> : null}
      {visibles.map((e) => (
        <Sugerencia
          key={e.nombre + e.cuando}
          viaje={viaje}
          nombre={e.nombre}
          meta={e.zona}
          motivo={e.motivo}
          fecha={e.fecha}
          cabecera={
            <Fila>
              <View style={{ backgroundColor: c.stub, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Texto variante="codigo" color="onStub" style={{ fontSize: 12 }}>{e.cuando}</Texto>
              </View>
              <Chip texto={e.categoria} />
            </Fila>
          }
        />
      ))}
      <Nota>Eventos de ejemplo. Más adelante: deportes y conciertos de Ticketmaster, ferias, mercadillos y exposiciones de PredictHQ, y una búsqueda web para lo más local.</Nota>
    </View>
  );
}
