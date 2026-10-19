/** No navegador o SIGAA bloqueia chamadas diretas (CORS): só a ponte funciona. */
import type { ResumoSigaa } from './types';

export const sigaaNativoDisponivel = false;

export class ErroSigaa extends Error {}

export async function buscarResumoNativo(_usuario: string, _senha: string): Promise<ResumoSigaa> {
  throw new ErroSigaa('O SIGAA direto do app só funciona no celular. No navegador, use a ponte.');
}
