/** Sugestões de perfil (curso e período) a partir dos dados lidos do SIGAA. */
import type { ResumoSigaa } from './types';

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em']);

/** "SISTEMAS DE INFORMAÇÃO/DC - SEDE - BACHARELADO" vira "Sistemas de Informação". */
export function cursoDoSigaa(programa: string | undefined): string | null {
  const nome = (programa ?? '').split(/\/| - /)[0].trim();
  if (!nome) return null;
  return nome
    .toLowerCase()
    .split(/\s+/)
    .map((p, i) => (i > 0 && MINUSCULAS.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(' ');
}

/** Período atual estimado: quantos semestres diferentes aparecem no histórico e nas turmas atuais. */
export function periodoEstimado(resumo: Pick<ResumoSigaa, 'historico' | 'disciplinas'>): string | null {
  const periodos = new Set<string>();
  resumo.historico.forEach((h) => h.periodo && periodos.add(h.periodo.trim()));
  resumo.disciplinas.forEach((d) => d.periodo && periodos.add(d.periodo.trim()));
  return periodos.size > 0 ? `${periodos.size}º` : null;
}
