import { AccentColors, Colors, type ThemeColors } from '@/constants/theme';
import { AparenciaContext } from '@/hooks/appearance-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useContext } from 'react';

export function useTheme(): ThemeColors {
  const aparencia = useContext(AparenciaContext);
  if (!aparencia) throw new Error('useTheme precisa estar dentro de <AstraProvider>.');
  const { modoAparencia, corDestaque } = aparencia;
  const esquemaDoSistema = useColorScheme();
  const scheme = modoAparencia === 'automatico'
    ? esquemaDoSistema === 'dark' ? 'dark' : 'light'
    : modoAparencia === 'escuro' ? 'dark' : 'light';
  const colors = Colors[scheme];
  const primary = AccentColors[corDestaque][scheme];
  return {
    ...colors,
    primary,
    onPrimary: scheme === 'dark' ? '#0C1424' : '#FFFFFF',
    primarySoft: scheme === 'dark' ? `${primary}26` : `${primary}18`,
  };
}
