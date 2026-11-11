/**
 * Tokens de cor do ASTRA. A marca é o azul-claro do logo (#9AD9EB);
 * a cor de ação é um azul mais escuro para manter contraste de texto (WCAG AA).
 */
export const Colors = {
  light: {
    background: '#F5F8FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EAF3F8',
    border: '#E1E9EF',
    text: '#14213D',
    textSecondary: '#52627A',
    textMuted: '#5B6A7E',
    primary: '#2A6595',
    onPrimary: '#FFFFFF',
    brand: '#9AD9EB',
    primarySoft: '#E1F0F8',
    success: '#15803D',
    successSoft: '#DCFCE7',
    warning: '#B45309',
    warningSoft: '#FEF3C7',
    danger: '#B91C1C',
    dangerSoft: '#FEE2E2',
  },
  dark: {
    background: '#0C1424',
    surface: '#152036',
    surfaceAlt: '#1C2B47',
    border: '#26385A',
    text: '#F1F5F9',
    textSecondary: '#B4C2D6',
    textMuted: '#8494AB',
    primary: '#7DB8DE',
    onPrimary: '#0C1424',
    brand: '#9AD9EB',
    primarySoft: '#1C3552',
    success: '#4ADE80',
    successSoft: '#12301F',
    warning: '#FBBF24',
    warningSoft: '#3A2A0B',
    danger: '#F87171',
    dangerSoft: '#3B1515',
  },
} as const;

export type ThemeColors = { [K in keyof typeof Colors.light]: string };

export const AccentColors = {
  original: { nome: 'Azul original', amostra: '#2A6595', light: '#2A6595', dark: '#7DB8DE' },
  verde: { nome: 'Verde', amostra: '#166534', light: '#166534', dark: '#86EFAC' },
  roxo: { nome: 'Roxo', amostra: '#6B21A8', light: '#6B21A8', dark: '#C084FC' },
  violeta: { nome: 'Violeta', amostra: '#5B21B6', light: '#5B21B6', dark: '#A78BFA' },
  turquesa: { nome: 'Azul-turquesa', amostra: '#0F766E', light: '#0F766E', dark: '#5EEAD4' },
  ambar: { nome: 'Âmbar', amostra: '#92400E', light: '#92400E', dark: '#FCD34D' },
} as const;

export type AccentColor = keyof typeof AccentColors;
