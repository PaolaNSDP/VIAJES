import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';
import { useViajes, ViajesProvider } from '@/data/store';

export default function RootLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = Colors[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, background: c.background, card: c.surface, text: c.text, primary: c.accent, border: c.line } }}>
      <ViajesProvider>
        <Pantallas />
      </ViajesProvider>
    </ThemeProvider>
  );
}

function Pantallas() {
  const { necesitaSesion } = useViajes();
  return (
    <Stack screenOptions={{ headerBackTitle: 'Viajes', headerShadowVisible: false }}>
      <Stack.Protected guard={!necesitaSesion}>
        <Stack.Screen name="index" options={{ title: 'Mis viajes' }} />
        <Stack.Screen name="nuevo" options={{ title: 'Nuevo viaje', presentation: 'modal' }} />
        <Stack.Screen name="viaje/[id]" options={{ title: '' }} />
      </Stack.Protected>
      <Stack.Protected guard={necesitaSesion}>
        <Stack.Screen name="entrar" options={{ title: 'Entrar', headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
