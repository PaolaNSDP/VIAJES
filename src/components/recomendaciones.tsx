import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, View } from 'react-native';

import { Spacing } from '@/constants/theme';
import { nuevoId, useViajes } from '@/data/store';
import { AMBIENTES, TIPOS_VIAJE, type Ambiente, type TipoViaje, type Viaje } from '@/data/types';
import { useTheme } from '@/hooks/use-theme';
import { diasDelViaje, fechaCorta } from '@/lib/fechas';
import { buscarCultura, buscarEventos, buscarRestaurantes } from '@/services/recomendaciones';

import { Boton, Chip, Fila, Nota, Tarjeta, Texto } from './ui';

type Carga<T> = { estado: 'cargando' } | { estado: 'ok'; datos: T } | { estado: 'error'; mensaje: string };

/** Carga un resultado asíncrono y lo vuelve a pedir cuando cambian las dependencias. */
function useCarga<T>(cargar: () => Promise<T>, deps: unknown[]): Carga<T> {
  const [carga, setCarga] = useState<Carga<T>>({ estado: 'cargando' });
  useEffect(() => {
    let vigente = true;
    setCarga({ estado: 'cargando' });
    cargar().then(
      (datos) => vigente && setCarga({ estado: 'ok', datos }),
      (e: Error) => vigente && setCarga({ estado: 'error', mensaje: e.message || 'Error de conexión.' }),
    );
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return carga;
}

function Estado({ carga, que }: { carga: Carga<unknown>; que: string }) {
  const c = useTheme();
  if (carga.estado === 'cargando')
    return (
      <Fila>
        <ActivityIndicator color={c.accent} />
        <Texto variante="secundario">Buscando {que}…</Texto>
      </Fila>
    );
  if (carga.estado === 'error')
    return (
      <Tarjeta>
        <Texto variante="subtitulo" style={{ fontSize: 16 }}>No se han podido cargar {que}</Texto>
        <Texto variante="secundario">{carga.mensaje} Comprueba la conexión y vuelve a abrir esta pestaña.</Texto>
      </Tarjeta>
    );
  return null;
}

/** Botón que añade una sugerencia al itinerario, en su fecha o en el primer día libre del viaje. */
function AnadirAlItinerario({ viaje, plan, fecha }: { viaje: Viaje; plan: string; fecha?: string }) {
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

function Sugerencia({ viaje, nombre, meta, texto, fecha, enlace, textoEnlace = 'Ver en el mapa', cabecera }: { viaje: Viaje; nombre: string; meta?: string; texto?: string; fecha?: string; enlace: string; textoEnlace?: string; cabecera?: ReactNode }) {
  return (
    <Tarjeta>
      {cabecera}
      <Texto variante="subtitulo" style={{ fontSize: 16 }}>{nombre}</Texto>
      {meta ? <Texto variante="secundario">{meta}</Texto> : null}
      {texto ? <Texto variante="secundario">{texto}</Texto> : null}
      <Fila style={{ gap: Spacing.three }}>
        <AnadirAlItinerario viaje={viaje} plan={nombre} fecha={fecha} />
        <Boton tipo="enlace" titulo={textoEnlace} onPress={() => Linking.openURL(enlace)} />
      </Fila>
    </Tarjeta>
  );
}

export function DondeComer({ viaje }: { viaje: Viaje }) {
  const [tipo, setTipo] = useState<TipoViaje>(viaje.tipo);
  const [ambiente, setAmbiente] = useState<Ambiente | null>(null);
  const carga = useCarga(() => buscarRestaurantes(viaje, tipo, ambiente), [viaje.destino, viaje.pais, tipo, ambiente]);

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
      <Estado carga={carga} que="sitios para comer" />
      {carga.estado === 'ok' && !carga.datos.length ? <Texto variante="secundario">No hay sitios con ese ambiente cerca del centro. Prueba otro.</Texto> : null}
      {carga.estado === 'ok'
        ? carga.datos.map((r) => (
            <Sugerencia key={r.id} viaje={viaje} nombre={r.nombre} meta={[r.resumen, r.zona].filter(Boolean).join(' · ')} texto={r.ambientes.length ? `Ambiente: ${r.ambientes.join(', ')}` : undefined} enlace={r.enlace} />
          ))
        : null}
      <Nota>Sitios del centro de {viaje.destino} según OpenStreetMap. El ambiente se deduce de sus datos (tipo de local, cocina, terraza, horario), no de reseñas.</Nota>
    </View>
  );
}

export function Cultura({ viaje }: { viaje: Viaje }) {
  const carga = useCarga(() => buscarCultura(viaje), [viaje.destino, viaje.pais]);
  return (
    <View style={{ gap: Spacing.three }}>
      <Texto variante="subtitulo">Visitas culturales</Texto>
      <Estado carga={carga} que="visitas culturales" />
      {carga.estado === 'ok' && !carga.datos.length ? <Texto variante="secundario">No se han encontrado visitas para este destino.</Texto> : null}
      {carga.estado === 'ok'
        ? carga.datos.map((v) => (
            <Sugerencia key={v.id} viaje={viaje} nombre={v.nombre} meta={v.tipo} texto={v.descripcion} enlace={v.enlace} textoEnlace={v.enlace.includes('google.com/maps') ? 'Ver en el mapa' : 'Web oficial'} />
          ))
        : null}
      <Nota>Museos, monumentos y miradores de OpenStreetMap, con descripciones de Wikidata. Al añadir una visita al itinerario se coloca en el primer día libre de tu viaje.</Nota>
    </View>
  );
}

export function Eventos({ viaje }: { viaje: Viaje }) {
  const c = useTheme();
  const [categoria, setCategoria] = useState<string>('Todos');
  const carga = useCarga(() => buscarEventos(viaje), [viaje.destino, viaje.pais, viaje.inicio, viaje.fin]);
  const eventos = carga.estado === 'ok' ? carga.datos.eventos : [];
  const categorias = ['Todos', ...new Set(eventos.map((e) => e.categoria))];
  const visibles = eventos.filter((e) => categoria === 'Todos' || e.categoria === categoria);

  return (
    <View style={{ gap: Spacing.three }}>
      <Texto variante="subtitulo">Qué pasa en {viaje.destino} durante tu viaje</Texto>
      <Estado carga={carga} que="eventos" />
      {eventos.length ? <Fila>{categorias.map((cat) => <Chip key={cat} texto={cat} activo={cat === categoria} onPress={() => setCategoria(cat)} />)}</Fila> : null}
      {carga.estado === 'ok' && !eventos.length ? <Texto variante="secundario">No se han encontrado eventos en tus fechas.</Texto> : null}
      {visibles.map((e) => (
        <Sugerencia
          key={e.nombre + e.fecha}
          viaje={viaje}
          nombre={e.nombre}
          meta={e.zona}
          texto={e.detalle}
          fecha={e.fecha}
          enlace={e.enlace}
          textoEnlace={e.categoria === 'Mercadillo' ? 'Ver en el mapa' : 'Entradas e info'}
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
      {carga.estado === 'ok' ? carga.datos.avisos.map((a) => <Nota key={a}>{a}</Nota>) : null}
    </View>
  );
}
