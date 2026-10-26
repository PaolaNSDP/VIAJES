import { useState } from 'react';
import { Platform, View } from 'react-native';

import { Boton, Campo, Fila, Nota, Pantalla, Tarjeta, Texto } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const MENSAJES: Record<string, string> = {
  'Invalid login credentials': 'El correo o la contraseña no son correctos.',
  'Email not confirmed': 'Antes de entrar, confirma tu cuenta con el enlace que te enviamos por correo.',
  'User already registered': 'Ya hay una cuenta con ese correo. Prueba a entrar.',
};

export default function Entrar() {
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar');
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const enviar = async () => {
    if (!supabase) return;
    setError(null);
    setAviso(null);
    if (!email.includes('@')) return setError('Escribe un correo válido.');
    if (clave.length < 6) return setError('La contraseña debe tener al menos 6 caracteres.');
    setEnviando(true);
    const { data, error } =
      modo === 'entrar'
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
        : await supabase.auth.signUp({
            email: email.trim(),
            password: clave,
            // En web, el enlace del correo vuelve a esta misma app.
            options: Platform.OS === 'web' ? { emailRedirectTo: window.location.origin + window.location.pathname.replace(/entrar\/?$/, '') } : undefined,
          });
    setEnviando(false);
    if (error) return setError(MENSAJES[error.message] ?? error.message);
    if (modo === 'crear' && !data.session) {
      setAviso('Te hemos enviado un correo. Pulsa el enlace para confirmar la cuenta y después entra aquí.');
      setModo('entrar');
    }
  };

  return (
    <Pantalla>
      <View style={{ gap: Spacing.one, marginTop: Spacing.five }}>
        <Texto variante="etiqueta">Viajes</Texto>
        <Texto variante="titulo">{modo === 'entrar' ? 'Entra en tu cuenta' : 'Crea tu cuenta'}</Texto>
        <Texto variante="secundario">Tus viajes se guardan en tu cuenta y los ves igual en el móvil y en el ordenador.</Texto>
      </View>
      <Tarjeta style={{ gap: Spacing.three }}>
        <Campo etiqueta="Correo" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
        <Campo
          etiqueta="Contraseña"
          value={clave}
          onChangeText={setClave}
          secureTextEntry
          autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'}
          onSubmitEditing={enviar}
        />
        {error ? <Texto color="danger">{error}</Texto> : null}
        <Fila>
          <Boton titulo={enviando ? 'Un momento…' : modo === 'entrar' ? 'Entrar' : 'Crear cuenta'} onPress={enviar} deshabilitado={enviando} />
          <Boton
            tipo="enlace"
            titulo={modo === 'entrar' ? 'No tengo cuenta' : 'Ya tengo cuenta'}
            onPress={() => {
              setModo(modo === 'entrar' ? 'crear' : 'entrar');
              setError(null);
            }}
          />
        </Fila>
      </Tarjeta>
      {aviso ? <Nota>{aviso}</Nota> : null}
    </Pantalla>
  );
}
