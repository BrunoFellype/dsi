/**
 * Frequência = 1 − faltas ÷ carga horária (a UFRPE exige pelo menos 75%).
 *
 * - Período atual: cada turma informa o máximo de faltas, que é 25% da carga horária,
 *   então a carga horária sai exata (máximo × 4).
 * - Curso todo: o relatório de notas traz as faltas de cada disciplina; a carga horária vem da
 *   coluna "CH" quando existe, da turma atual com o mesmo código, ou é estimada em 60 h.
 */
import type { DisciplinaSigaa, HistoricoDisciplina } from './types';

/** Carga horária usada quando o SIGAA não informa (disciplina de 4 créditos). */
export const CARGA_HORARIA_PADRAO = 60;
export const FREQUENCIA_MINIMA = 75;

export interface Frequencia {
  /** 0 a 100. */
  percentual: number;
  faltas: number;
  cargaHoraria: number;
  disciplinas: number;
  /** Alguma carga horária foi estimada em 60 h. */
  estimada: boolean;
}

export interface FrequenciaDisciplina {
  codigo: string;
  titulo: string;
  faltas: number;
  maxFaltas: number;
  percentual: number;
}

const percentual = (faltas: number, carga: number) => Math.max(0, Math.min(100, (1 - faltas / carga) * 100));

const cargaDaTurma = (d: DisciplinaSigaa) => (d.maxFaltas && d.maxFaltas > 0 ? d.maxFaltas * 4 : null);

/** Frequência de cada turma do período atual (só as que têm faltas lançadas). */
export function frequenciaPorDisciplina(disciplinas: DisciplinaSigaa[]): FrequenciaDisciplina[] {
  return disciplinas
    .filter((d) => d.faltas !== null && d.faltas !== undefined && cargaDaTurma(d) !== null)
    .map((d) => ({
      codigo: d.codigo,
      titulo: d.titulo,
      faltas: d.faltas!,
      maxFaltas: d.maxFaltas!,
      percentual: percentual(d.faltas!, cargaDaTurma(d)!),
    }));
}

/** Frequência somada das turmas do período atual. */
export function frequenciaDoPeriodo(disciplinas: DisciplinaSigaa[]): Frequencia | null {
  const itens = frequenciaPorDisciplina(disciplinas);
  if (itens.length === 0) return null;
  const faltas = itens.reduce((s, d) => s + d.faltas, 0);
  const carga = itens.reduce((s, d) => s + d.maxFaltas * 4, 0);
  return { percentual: percentual(faltas, carga), faltas, cargaHoraria: carga, disciplinas: itens.length, estimada: false };
}

/** Frequência de todo o curso: histórico mais as turmas atuais que ainda não aparecem nele. */
export function frequenciaDoCurso(historico: HistoricoDisciplina[], atuais: DisciplinaSigaa[]): Frequencia | null {
  const cargaPorCodigo = new Map<string, number>();
  atuais.forEach((d) => {
    const c = cargaDaTurma(d);
    if (c) cargaPorCodigo.set(d.codigo, c);
  });

  let faltas = 0;
  let carga = 0;
  let disciplinas = 0;
  let estimada = false;
  const contadas = new Set<string>();

  historico.forEach((h) => {
    if (h.faltas === null || h.faltas === undefined) return;
    const ch = h.cargaHoraria ?? cargaPorCodigo.get(h.codigo) ?? null;
    if (ch === null) estimada = true;
    faltas += h.faltas;
    carga += ch ?? CARGA_HORARIA_PADRAO;
    disciplinas += 1;
    contadas.add(`${h.periodo}|${h.codigo}`);
  });

  atuais.forEach((d) => {
    const ch = cargaDaTurma(d);
    if (d.faltas === null || d.faltas === undefined || !ch || contadas.has(`${d.periodo}|${d.codigo}`)) return;
    faltas += d.faltas;
    carga += ch;
    disciplinas += 1;
  });

  if (disciplinas === 0 || carga === 0) return null;
  return { percentual: percentual(faltas, carga), faltas, cargaHoraria: carga, disciplinas, estimada };
}
