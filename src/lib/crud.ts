import type { Aviso, RegistroDiario, TipoAviso } from './types';

/** Remove uma mensagem e as correções que a citavam, como origem ou como âncora. */
export function removerAvisoEComCorrecoes(
  avisos: Aviso[],
  correcoes: Record<string, string>,
  id: string
): { avisos: Aviso[]; correcoes: Record<string, string> } {
  return {
    avisos: avisos.filter((a) => a.id !== id),
    correcoes: Object.fromEntries(
      Object.entries(correcoes).filter(([origem, ancora]) => origem !== id && ancora !== id)
    ),
  };
}

/** Desfaz a correção de uma mensagem, que volta para o agrupamento automático. */
export function desfazerCorrecaoDoAviso(correcoes: Record<string, string>, avisoId: string): Record<string, string> {
  const resto = { ...correcoes };
  delete resto[avisoId];
  return resto;
}

/** Remove o registro do diário de um dia. */
export function removerRegistroDoDia(diario: RegistroDiario[], dia: string): RegistroDiario[] {
  return diario.filter((r) => r.dia !== dia);
}

export interface EdicaoAviso {
  texto?: string;
  tipo?: TipoAviso;
  /** null apaga a disciplina. */
  disciplina?: string | null;
  /** ISO; null apaga o prazo. */
  prazo?: string | null;
  /** O horário do prazo não foi informado. */
  horaNaoInformada?: boolean;
}

/** Edita uma mensagem. Quem edita o prazo já confirma o horário (ou diz que não foi informado). */
export function editarAvisoNaLista(avisos: Aviso[], id: string, edicao: EdicaoAviso): Aviso[] {
  return avisos.map((a) => {
    if (a.id !== id) return a;
    const novo: Aviso = { ...a };
    if (edicao.texto !== undefined) novo.texto = edicao.texto.trim() || a.texto;
    if (edicao.tipo !== undefined) novo.tipo = edicao.tipo;
    if (edicao.disciplina !== undefined) novo.disciplina = edicao.disciplina?.trim() || undefined;
    if (edicao.prazo !== undefined) {
      novo.prazo = edicao.prazo ?? undefined;
      novo.prazoSemHora = undefined;
      novo.horaNaoInformada = edicao.prazo ? Boolean(edicao.horaNaoInformada) || undefined : undefined;
    }
    return novo;
  });
}
