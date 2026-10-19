/**
 * Exportação das correções de agrupamento feitas pelo estudante (aprendizado ativo).
 * Fica no aparelho: o estudante decide se compartilha o arquivo. Os textos saem sem nome de remetente.
 */
import type { Aviso, Grupo } from './types';

export interface CorrecaoExportada {
  texto: string;
  disciplina?: string;
  fonte: string;
  grupoEscolhido: string;
}

export function montarExportacao(grupos: Grupo[], correcoes: Record<string, string>): CorrecaoExportada[] {
  const porId = new Map<string, { aviso: Aviso; grupo: Grupo }>();
  grupos.forEach((g) => g.avisos.forEach((a) => porId.set(a.id, { aviso: a, grupo: g })));

  const lista: CorrecaoExportada[] = [];
  Object.keys(correcoes).forEach((id) => {
    const item = porId.get(id);
    if (!item) return;
    lista.push({
      texto: item.aviso.texto,
      disciplina: item.aviso.disciplina,
      fonte: item.aviso.fonte,
      grupoEscolhido: item.grupo.rotulo,
    });
  });
  return lista;
}
