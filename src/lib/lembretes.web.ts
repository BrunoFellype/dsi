/** No navegador não há lembretes agendados no sistema. */
import type { Lembrete } from './lembretesLogica';

export const lembretesDisponiveis = false;

export async function pedirPermissaoLembretes(): Promise<boolean> {
  return false;
}

export async function cancelarLembretes(): Promise<void> {}

export async function agendarLembretes(_lembretes: Lembrete[]): Promise<number> {
  return 0;
}
