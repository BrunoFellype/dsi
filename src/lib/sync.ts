/** Regras da atualização automática do SIGAA. */

/** Horas sem atualizar até o app buscar o SIGAA de novo sozinho. */
export const HORAS_ENTRE_SINCRONIZACOES = 6;

export function precisaAtualizar(
  ultima: string | null,
  agora: Date = new Date(),
  horas: number = HORAS_ENTRE_SINCRONIZACOES
): boolean {
  if (!ultima) return true;
  const t = new Date(ultima).getTime();
  if (isNaN(t)) return true;
  return agora.getTime() - t >= horas * 3600000;
}
