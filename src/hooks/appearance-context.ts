import { createContext } from 'react';

import type { AccentColor } from '@/constants/colors';

export type ModoAparencia = 'claro' | 'escuro' | 'automatico';

export interface ContextoAparencia {
  modoAparencia: ModoAparencia;
  corDestaque: AccentColor;
}

export const AparenciaContext = createContext<ContextoAparencia | null>(null);
