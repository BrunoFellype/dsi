import '@/global.css';

export { Colors, type ThemeColors } from './colors';

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = { sm: 8, md: 12, lg: 16, pill: 999 } as const;

/** Largura máxima do conteúdo: em telas grandes o app fica centralizado, como no celular. */
export const MaxContentWidth = 560;
