import { router } from 'expo-router';
import { useState } from 'react';

import { Boton, Campo, Fila, Pantalla, Selector, Tarjeta } from '@/components/ui';
import { useViajes } from '@/data/store';
import { TIPOS_VIAJE, type TipoViaje } from '@/data/types';
import { esFechaValida } from '@/lib/fechas';

export default function NuevoViaje() {
  const { crearViaje } = useViajes();
  const [destino, setDestino] = useState('');
  const [pais, setPais] = useState('');
  const [origen, setOrigen] = useState('MAD');
  const [iata, setIata] = useState('');
  const [inicio, setInicio] = useState('');
  const [fin, setFin] = useState('');
  const [tipo, setTipo] = useState<TipoViaje>('En pareja');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const crear = () => {
    const e: Record<string, string> = {};
    if (!destino.trim()) e.destino = 'Escribe el destino';
    if (!esFechaValida(inicio)) e.inicio = 'Usa el formato AAAA-MM-DD';
    if (!esFechaValida(fin)) e.fin = 'Usa el formato AAAA-MM-DD';
    else if (!e.inicio && fin < inicio) e.fin = 'La vuelta no puede ser antes de la ida';
    setErrores(e);
    if (Object.keys(e).length) return;
    const id = crearViaje({ destino: destino.trim(), pais: pais.trim(), origen: origen.trim().toUpperCase(), iata: iata.trim().toUpperCase(), inicio, fin, tipo });
    router.replace({ pathname: '/viaje/[id]', params: { id } });
  };

  return (
    <Pantalla>
      <Tarjeta style={{ gap: 16 }}>
        <Campo etiqueta="Destino" value={destino} onChangeText={setDestino} placeholder="p. ej. Oporto" error={errores.destino} autoFocus />
        <Fila style={{ alignItems: 'flex-start' }}>
          <Campo etiqueta="País" value={pais} onChangeText={setPais} />
          <Campo etiqueta="Sales de (aeropuerto)" value={origen} onChangeText={setOrigen} maxLength={3} autoCapitalize="characters" />
          <Campo etiqueta="Llegas a (aeropuerto)" value={iata} onChangeText={setIata} maxLength={3} autoCapitalize="characters" placeholder="OPO" />
        </Fila>
        <Fila style={{ alignItems: 'flex-start' }}>
          <Campo etiqueta="Ida" value={inicio} onChangeText={setInicio} placeholder="AAAA-MM-DD" error={errores.inicio} keyboardType="numbers-and-punctuation" />
          <Campo etiqueta="Vuelta" value={fin} onChangeText={setFin} placeholder="AAAA-MM-DD" error={errores.fin} keyboardType="numbers-and-punctuation" />
        </Fila>
        <Selector etiqueta="Tipo de viaje" opciones={TIPOS_VIAJE} valor={tipo} onChange={setTipo} />
        <Fila>
          <Boton titulo="Crear viaje" onPress={crear} />
          <Boton tipo="enlace" titulo="Cancelar" onPress={() => router.back()} />
        </Fila>
      </Tarjeta>
    </Pantalla>
  );
}
