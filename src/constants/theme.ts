/**
 * Colores de la app en modo claro y oscuro. Provisionales: el diseño visual se revisará más adelante.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#18232f',
    textSecondary: '#5d6b78',
    background: '#eef1f3',
    surface: '#ffffff',
    line: '#d7dde3',
    accent: '#2f56c9',
    accentSoft: '#e3e9fb',
    onAccent: '#ffffff',
    stub: '#f1b52c',
    onStub: '#3a2a00',
    danger: '#b5651d',
  },
  dark: {
    text: '#e8edf2',
    textSecondary: '#9aa8b5',
    background: '#0f151c',
    surface: '#18212b',
    line: '#2a3642',
    accent: '#7d9cff',
    accentSoft: '#1f2a47',
    onAccent: '#0f151c',
    stub: '#e5a91f',
    onStub: '#2a1e00',
    danger: '#e39a55',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', mono: 'ui-monospace' },
  default: { sans: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', mono: 'var(--font-mono)' },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 600;
