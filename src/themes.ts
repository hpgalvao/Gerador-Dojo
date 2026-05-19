export interface ThemeColors {
  id: string;
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  bg: string;
  text: string;
  card: string;
  border: string;
}

export const THEMES: ThemeColors[] = [
  {
    id: 'samurai',
    name: 'Samurai (Padrão)',
    primary: '#f59e0b', // amber-500
    secondary: '#18181b', // zinc-900
    accent: '#fde68a', // amber-200
    bg: '#000000',
    text: '#ffffff',
    card: '#09090b', // zinc-950
    border: '#27272a', // zinc-800
  },
  {
    id: 'ghost',
    name: 'Ghost Knight',
    primary: '#0ea5e9', // sky-500
    secondary: '#111827', // gray-900
    accent: '#7dd3fc', // sky-300
    bg: '#030712', // gray-950
    text: '#f8fafc',
    card: '#0f172a',
    border: '#1e293b',
  },
  {
    id: 'sakura',
    name: 'Sakura Dojô',
    primary: '#ec4899', // pink-500
    secondary: '#18181b',
    accent: '#f9a8d4', // pink-300
    bg: '#0a0a0a',
    text: '#ffffff',
    card: '#111111',
    border: '#27272a',
  },
  {
    id: 'forest',
    name: 'Forest Master',
    primary: '#22c55e', // green-500
    secondary: '#064e3b', // emerald-900
    accent: '#86efac', // green-300
    bg: '#020617',
    text: '#f0fdf4',
    card: '#022c22',
    border: '#065f46',
  },
  {
    id: 'blood',
    name: 'Blood Moon',
    primary: '#ef4444', // red-500
    secondary: '#450a0a', // red-950
    accent: '#fca5a5', // red-300
    bg: '#000000',
    text: '#ffffff',
    card: '#1a0505',
    border: '#450a0a',
  }
];
