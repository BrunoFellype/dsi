import test from 'node:test';
import assert from 'node:assert/strict';
import { frequenciaDoCurso, frequenciaDoPeriodo, frequenciaPorDisciplina } from '../frequencia';
import type { DisciplinaSigaa, HistoricoDisciplina } from '../types';

const turma = (codigo: string, faltas: number | null, maxFaltas: number | null, periodo = '2026.2'): DisciplinaSigaa => ({
  codigo,
  titulo: `Disciplina ${codigo}`,
  periodo,
  faltas,
  maxFaltas,
});

const hist = (codigo: string, periodo: string, faltas: number | null, cargaHoraria?: number): HistoricoDisciplina => ({
  codigo,
  titulo: `Disciplina ${codigo}`,
  periodo,
  mediaFinal: 8,
  faltas,
  situacao: 'APROVADO',
  cargaHoraria,
});

test('período: carga horária sai do máximo de faltas (25%) e a frequência soma as turmas', () => {
  // A: 60h (máx 15), 6 faltas; B: 30h (máx 7,5 → 8 no SIGAA = 32h), 0 faltas
  const f = frequenciaDoPeriodo([turma('A', 6, 15), turma('B', 0, 8), turma('C', null, 15)]);
  assert.ok(f);
  assert.equal(f.disciplinas, 2);
  assert.equal(f.faltas, 6);
  assert.equal(f.cargaHoraria, 60 + 32);
  assert.equal(Math.round(f.percentual * 10) / 10, Math.round((1 - 6 / 92) * 1000) / 10);
  assert.equal(f.estimada, false);
});

test('período sem faltas lançadas não tem frequência', () => {
  assert.equal(frequenciaDoPeriodo([turma('A', null, null)]), null);
});

test('por disciplina: percentual de cada turma', () => {
  const [a] = frequenciaPorDisciplina([turma('A', 15, 15)]);
  assert.equal(a.percentual, 75);
});

test('curso: usa CH do relatório, da turma atual ou 60 h estimadas, sem contar duas vezes', () => {
  const historico = [
    hist('X', '2025.1', 10, 30), // 30h informadas
    hist('Y', '2025.2', 6), // sem CH → 60h estimadas
    hist('A', '2026.2', 4), // período atual: CH vem da turma (máx 15 → 60h)
  ];
  const atuais = [turma('A', 6, 15), turma('B', 2, 8)]; // A já está no histórico; B não
  const f = frequenciaDoCurso(historico, atuais);
  assert.ok(f);
  assert.equal(f.disciplinas, 4);
  assert.equal(f.faltas, 10 + 6 + 4 + 2);
  assert.equal(f.cargaHoraria, 30 + 60 + 60 + 32);
  assert.equal(f.estimada, true);
});

test('curso sem nenhuma falta registrada não tem frequência', () => {
  assert.equal(frequenciaDoCurso([hist('X', '2025.1', null)], []), null);
});

test('frequência nunca passa de 0 a 100', () => {
  const f = frequenciaDoPeriodo([turma('A', 99, 15)]);
  assert.equal(f?.percentual, 0);
});
