import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';

import { VIAJES_EJEMPLO } from './ejemplo';
import type { ElementoDe, SeccionEditable, Viaje } from './types';

const CLAVE = 'viajes:v1';

export const nuevoId = () => Math.random().toString(36).slice(2, 10);

type Store = {
  cargado: boolean;
  viajes: Viaje[];
  /** Hay nube configurada pero nadie ha iniciado sesión. */
  necesitaSesion: boolean;
  email: string | null;
  errorNube: string | null;
  salir: () => void;
  crearViaje: (datos: Omit<Viaje, 'id' | 'transporte' | 'hoteles' | 'itinerario' | 'gastos'>) => string;
  borrarViaje: (id: string) => void;
  guardarElemento: <S extends SeccionEditable>(viajeId: string, seccion: S, elemento: ElementoDe<S>) => void;
  borrarElemento: (viajeId: string, seccion: SeccionEditable, elementoId: string) => void;
};

const Contexto = createContext<Store | null>(null);

async function leerLocal(): Promise<Viaje[] | null> {
  try {
    const json = await AsyncStorage.getItem(CLAVE);
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
}

const guardarLocal = (viajes: Viaje[]) => AsyncStorage.setItem(CLAVE, JSON.stringify(viajes)).catch(() => {});

/** Sube a la nube los viajes nuevos o cambiados y borra los que ya no están. */
async function sincronizar(antes: Viaje[], despues: Viaje[]) {
  if (!supabase) return;
  const cambiados = despues.filter((v) => !antes.includes(v));
  const borrados = antes.filter((v) => !despues.some((d) => d.id === v.id)).map((v) => v.id);
  if (cambiados.length) {
    const { error } = await supabase.from('viajes').upsert(cambiados.map((v) => ({ id: v.id, datos: v, actualizado: new Date().toISOString() })));
    if (error) throw error;
  }
  if (borrados.length) {
    const { error } = await supabase.from('viajes').delete().in('id', borrados);
    if (error) throw error;
  }
}

/**
 * Guarda los viajes en el dispositivo y, si hay sesión iniciada, también en Supabase.
 * La copia local permite abrir la app sin conexión; la nube manda al iniciar sesión.
 */
export function ViajesProvider({ children }: { children: ReactNode }) {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargado, setCargado] = useState(false);
  const [sesion, setSesion] = useState<Session | null>(null);
  const [sesionComprobada, setSesionComprobada] = useState(!supabase);
  const [errorNube, setErrorNube] = useState<string | null>(null);
  const viajesRef = useRef(viajes);
  viajesRef.current = viajes;

  // Sesión de Supabase
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setSesionComprobada(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, nueva) => setSesion(nueva));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = sesion?.user.id;

  // Carga: primero lo del dispositivo, luego lo de la nube si hay sesión.
  useEffect(() => {
    if (!sesionComprobada) return;
    let vigente = true;
    (async () => {
      const local = await leerLocal();
      if (!supabase || !userId) {
        if (vigente) setViajes(local ?? VIAJES_EJEMPLO);
      } else {
        if (vigente && local) setViajes(local);
        const { data, error } = await supabase.from('viajes').select('datos');
        if (!vigente) return;
        if (error) {
          setErrorNube('No se han podido cargar tus viajes de la nube. Se muestran los guardados en este dispositivo.');
          setViajes(local ?? []);
        } else if (data.length) {
          const remotos = data.map((f) => f.datos as Viaje);
          setViajes(remotos);
          guardarLocal(remotos);
        } else {
          // Primera vez con cuenta: se sube lo que hubiera en el dispositivo.
          const iniciales = local ?? VIAJES_EJEMPLO;
          setViajes(iniciales);
          sincronizar([], iniciales).catch(() => setErrorNube('No se han podido subir tus viajes a la nube.'));
        }
      }
      if (vigente) setCargado(true);
    })();
    return () => {
      vigente = false;
    };
  }, [sesionComprobada, userId]);

  const actualizar = useCallback(
    (cambio: (prev: Viaje[]) => Viaje[]) => {
      const antes = viajesRef.current;
      const despues = cambio(antes);
      viajesRef.current = despues;
      setViajes(despues);
      guardarLocal(despues);
      if (userId)
        sincronizar(antes, despues).then(
          () => setErrorNube(null),
          () => setErrorNube('Sin conexión con la nube: el último cambio solo se ha guardado en este dispositivo.'),
        );
    },
    [userId],
  );

  const store = useMemo<Store>(
    () => ({
      cargado,
      viajes,
      necesitaSesion: !!supabase && sesionComprobada && !sesion,
      email: sesion?.user.email ?? null,
      errorNube,
      salir: () => {
        supabase?.auth.signOut();
        AsyncStorage.removeItem(CLAVE).catch(() => {});
        setViajes([]);
        setCargado(false);
      },
      crearViaje: (datos) => {
        const id = nuevoId();
        actualizar((prev) => [...prev, { ...datos, id, transporte: [], hoteles: [], itinerario: [], gastos: [] }]);
        return id;
      },
      borrarViaje: (id) => actualizar((prev) => prev.filter((v) => v.id !== id)),
      guardarElemento: (viajeId, seccion, elemento) =>
        actualizar((prev) =>
          prev.map((v) => {
            if (v.id !== viajeId) return v;
            const lista = v[seccion] as ElementoDe<typeof seccion>[];
            const existe = lista.some((e) => e.id === elemento.id);
            return { ...v, [seccion]: existe ? lista.map((e) => (e.id === elemento.id ? elemento : e)) : [...lista, elemento] };
          }),
        ),
      borrarElemento: (viajeId, seccion, elementoId) =>
        actualizar((prev) =>
          prev.map((v) =>
            v.id === viajeId ? { ...v, [seccion]: (v[seccion] as { id: string }[]).filter((e) => e.id !== elementoId) } : v,
          ),
        ),
    }),
    [cargado, viajes, sesion, sesionComprobada, errorNube, actualizar],
  );

  return <Contexto.Provider value={store}>{children}</Contexto.Provider>;
}

export function useViajes() {
  const store = useContext(Contexto);
  if (!store) throw new Error('useViajes debe usarse dentro de ViajesProvider');
  return store;
}

export function useViaje(id: string | undefined) {
  const { viajes } = useViajes();
  return viajes.find((v) => v.id === id);
}
