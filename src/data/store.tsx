import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { VIAJES_EJEMPLO } from './ejemplo';
import type { ElementoDe, SeccionEditable, Viaje } from './types';

const CLAVE = 'viajes:v1';

export const nuevoId = () => Math.random().toString(36).slice(2, 10);

type Store = {
  cargado: boolean;
  viajes: Viaje[];
  crearViaje: (datos: Omit<Viaje, 'id' | 'transporte' | 'hoteles' | 'itinerario' | 'gastos'>) => string;
  borrarViaje: (id: string) => void;
  guardarElemento: <S extends SeccionEditable>(viajeId: string, seccion: S, elemento: ElementoDe<S>) => void;
  borrarElemento: (viajeId: string, seccion: SeccionEditable, elementoId: string) => void;
};

const Contexto = createContext<Store | null>(null);

/**
 * Guarda los viajes en el dispositivo (AsyncStorage; localStorage en web).
 * Más adelante este es el único sitio que habrá que cambiar para sincronizar con la nube.
 */
export function ViajesProvider({ children }: { children: ReactNode }) {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE)
      .then((json) => setViajes(json ? JSON.parse(json) : VIAJES_EJEMPLO))
      .catch(() => setViajes(VIAJES_EJEMPLO))
      .finally(() => setCargado(true));
  }, []);

  const actualizar = useCallback((cambio: (prev: Viaje[]) => Viaje[]) => {
    setViajes((prev) => {
      const siguiente = cambio(prev);
      AsyncStorage.setItem(CLAVE, JSON.stringify(siguiente)).catch(() => {});
      return siguiente;
    });
  }, []);

  const store = useMemo<Store>(
    () => ({
      cargado,
      viajes,
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
    [cargado, viajes, actualizar],
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
